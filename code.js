// Show UI
figma.showUI(__html__, {
  width: 320,
  height: 400,
  themeColors: true
});

// Initial selection state
const hasValidSelection = figma.currentPage.selection.length > 0;
figma.ui.postMessage({ type: 'selectionchange', hasValidSelection });

// Helper function to create vector paths from bounds
function createBoundsPath(bounds) {
  return {
    vertices: [
      { x: 0, y: 0 },
      { x: bounds.width, y: 0 },
      { x: bounds.width, y: bounds.height },
      { x: 0, y: bounds.height }
    ],
    segments: [
      { start: 0, end: 1 },
      { start: 1, end: 2 },
      { start: 2, end: 3 },
      { start: 3, end: 0 }
    ],
    regions: [{
      windingRule: "NONZERO",
      loops: [[0, 1, 2, 3]]
    }]
  };
}

async function convertToSvg(node, retainOriginal) {
  try {
    console.log('Starting vector conversion for:', node.type);
    
    // Step 1: Export the node as SVG with adjusted settings
    console.log('Exporting node as SVG...');
    const svgBytes = await node.exportAsync({
      format: 'SVG',
      svgOutlineText: true,  // Convert text to outlines
      svgIdAttribute: false  // Avoid using IDs
    });
    
    // Convert Uint8Array to string
    const svgString = String.fromCharCode.apply(null, svgBytes);
    
    console.log('SVG data length:', svgString.length);
    console.log('SVG string content:', svgString.substring(0, 100) + '...'); // Log first 100 chars
    
    // Step 2: Create new node directly from SVG string
    console.log('Creating new node from SVG...');
    const importedNode = await figma.createNodeFromSvg(svgString);
    
    if (!importedNode) {
      throw new Error('Failed to create node from SVG');
    }
    
    console.log('Successfully created node from SVG');
    
    // Step 3: Position the new node
    console.log('Positioning new node...');
    importedNode.x = retainOriginal ? node.x + node.width + 100 : node.x;
    importedNode.y = node.y;
    
    // Add to the same parent as original node
    if (node.parent) {
      node.parent.appendChild(importedNode);
    }
    
    // Step 4: Flatten the imported node
    console.log('Flattening imported node...');
    const flattenedNode = figma.flatten([importedNode]);
    
    // Remove original if not retaining
    if (!retainOriginal && node.parent) {
      node.remove();
    }
    
    figma.notify('Successfully created and flattened vector');
    return flattenedNode;

  } catch (error) {
    console.error('Vector conversion failed:', error);
    console.error('Node type:', node.type);
    console.error('Node size:', node.width, 'x', node.height);
    figma.notify('Vector conversion failed: ' + error.message);
    throw error;
  }
}

async function flattenToPNG(node, retainOriginal) {
  try {
    console.log('Starting PNG flattening for:', node.type);
    
    // Export as PNG
    const pngData = await node.exportAsync({
      format: 'PNG',
      constraint: { type: 'SCALE', value: 2 }
    });

    // Create rectangle for PNG
    const rect = figma.createRectangle();
    
    try {
      // Set size and position
      rect.resize(node.width, node.height);
      if (retainOriginal) {
        rect.x = node.x + node.width + 100;
        rect.y = node.y;
      } else {
        rect.x = node.x;
        rect.y = node.y;
      }

      // Create image fill
      const imageHash = figma.createImage(pngData).hash;
      rect.fills = [{
        type: 'IMAGE',
        scaleMode: 'FILL',
        imageHash: imageHash
      }];

      // Copy properties safely
      rect.name = (node.name || "Layer") + " (Flattened PNG)";
      if (typeof node.opacity === 'number') {
        rect.opacity = node.opacity;
      }
      if (node.effects && Array.isArray(node.effects)) {
        rect.effects = node.effects;
      }
      if (node.blendMode) {
        rect.blendMode = node.blendMode;
      }

      // Add to parent
      if (node.parent) {
        node.parent.appendChild(rect);
      }

      // Remove original if not retaining
      if (!retainOriginal && node.parent) {
        node.remove();
      }

      figma.notify("Successfully flattened to PNG");
      return rect;
    } catch (propertyError) {
      console.error('Error copying properties:', propertyError);
      // If property copying fails, still return the rectangle
      return rect;
    }

  } catch (error) {
    console.error('PNG flattening failed:', error);
    figma.notify('PNG flattening failed: ' + error.message);
    throw error;
  }
}

// Listen to selection changes
figma.on('selectionchange', () => {
  const hasValidSelection = figma.currentPage.selection.length > 0;
  figma.ui.postMessage({ type: 'selectionchange', hasValidSelection });
});

// Message handler
figma.ui.onmessage = async msg => {
  if (msg.type === 'flatten') {
    const selection = figma.currentPage.selection;
    
    if (selection.length !== 1) {
      figma.notify('Please select a single frame or group');
      figma.ui.postMessage({ type: 'complete' });
      return;
    }

    const node = selection[0];
    const retainOriginal = msg.retainOriginal;
    
    try {
      if (msg.format === 'PNG') {
        await flattenToPNG(node, retainOriginal);
      } else {
        await convertToSvg(node, retainOriginal);
      }
      // Send completion message to hide processing modal
      figma.ui.postMessage({ type: 'complete' });
    } catch (error) {
      console.error('Process failed:', error);
      console.error('Node type:', node.type);
      console.error('Node size:', node.width, 'x', node.height);
      figma.notify('Process failed. Check console for details.');
      // Send completion message even if there's an error
      figma.ui.postMessage({ type: 'complete' });
    }
  }
};
