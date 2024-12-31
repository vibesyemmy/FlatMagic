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

// Helper function to create a clipping mask
async function createClippingMask(node) {
  // Create a rectangle for clipping
  const clipRect = figma.createRectangle();
  clipRect.resize(node.width, node.height);
  clipRect.x = node.x;
  clipRect.y = node.y;
  
  // Make the rectangle white (or any color, it doesn't matter as it's a mask)
  clipRect.fills = [{
    type: 'SOLID',
    color: { r: 1, g: 1, b: 1 }
  }];
  
  return clipRect;
}

// Helper function to process strokes
async function processStrokes(node) {
  // If node has strokes, outline them
  if (node.strokes && node.strokes.length > 0) {
    try {
      // Create a clone to preserve the original node's properties
      const clone = node.clone();
      
      // Outline the strokes
      const outlinedStroke = await figma.flatten([clone]);
      
      // Position the outlined stroke
      outlinedStroke.x = node.x;
      outlinedStroke.y = node.y;
      
      // Add to the same parent as original node
      if (node.parent) {
        node.parent.appendChild(outlinedStroke);
      }
      
      // Group the original node and outlined stroke
      const group = figma.group([node, outlinedStroke], node.parent);
      return group;
    } catch (error) {
      console.error('Failed to process strokes:', error);
      return node;
    }
  }
  return node;
}

async function convertToSvg(node, retainOriginal) {
  try {
    console.log('Starting vector conversion for:', node.type);
    
    // Check if the node is a frame with clipsContent enabled
    const shouldClip = node.type === 'FRAME' && node.clipsContent;
    let processedNode = node;
    let clipMask = null;
    
    // If clipping is needed, create a mask
    if (shouldClip) {
      console.log('Frame has clipsContent enabled, creating mask...');
      clipMask = await createClippingMask(node);
      // Group the node with its mask
      const group = figma.group([node.clone(), clipMask], node.parent);
      // Set the mask
      clipMask.isMask = true;
      processedNode = group;
    }
    
    // Process strokes
    processedNode = await processStrokes(processedNode);
    
    // Step 1: Export the node as SVG with adjusted settings
    console.log('Exporting node as SVG...');
    const svgBytes = await processedNode.exportAsync({
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
    
    // Step 4: Flatten the imported node while preserving appearance
    console.log('Flattening imported node...');
    const flattenedNode = figma.flatten([importedNode]);
    
    // Clean up temporary nodes if we created a clip mask
    if (shouldClip && processedNode && processedNode.parent) {
      processedNode.remove();
    }
    
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

async function convertToSvgPreserved(node, retainOriginal) {
  try {
    console.log('Starting preserved vector conversion for:', node.type);
    
    // Check if the node is a frame with clipsContent enabled
    const shouldClip = node.type === 'FRAME' && node.clipsContent;
    let processedNode = node;
    let clipMask = null;
    
    // If clipping is needed, create a mask
    if (shouldClip) {
      console.log('Frame has clipsContent enabled, creating mask...');
      clipMask = await createClippingMask(node);
      // Group the node with its mask
      const group = figma.group([node.clone(), clipMask], node.parent);
      // Set the mask
      clipMask.isMask = true;
      processedNode = group;
    }
    
    // Export as SVG
    const svgBytes = await processedNode.exportAsync({
      format: 'SVG',
      svgOutlineText: true,
      svgIdAttribute: false
    });
    
    // Convert to string
    const svgString = String.fromCharCode.apply(null, svgBytes);
    
    // Create new node from SVG
    const importedNode = await figma.createNodeFromSvg(svgString);
    
    if (!importedNode) {
      throw new Error('Failed to create node from SVG');
    }
    
    // Position the new node
    importedNode.x = retainOriginal ? node.x + node.width + 100 : node.x;
    importedNode.y = node.y;
    
    // Add to parent
    if (node.parent) {
      node.parent.appendChild(importedNode);
    }
    
    // Clean up temporary nodes if we created a clip mask
    if (shouldClip && processedNode && processedNode.parent) {
      processedNode.remove();
    }
    
    // Remove original if not retaining
    if (!retainOriginal && node.parent) {
      node.remove();
    }
    
    figma.notify('Successfully converted to vector');
    return importedNode;
    
  } catch (error) {
    console.error('Vector conversion failed:', error);
    console.error('Node type:', node.type);
    console.error('Node size:', node.width, 'x', node.height);
    figma.notify('Vector conversion failed: ' + error.message);
    throw error;
  }
}

async function flattenToPNG(node, retainOriginal, scale) {
  try {
    console.log('Starting PNG flattening for:', node.type);
    
    // Process strokes before PNG export
    const processedNode = await processStrokes(node);
    
    // Export as PNG
    const pngData = await processedNode.exportAsync({
      format: 'PNG',
      constraint: { type: 'SCALE', value: scale }
    });

    // Create rectangle for PNG
    const rect = figma.createRectangle();
    
    try {
      // Set size and position
      rect.resize(processedNode.width, processedNode.height);
      if (retainOriginal) {
        rect.x = processedNode.x + processedNode.width + 100;
        rect.y = processedNode.y;
      } else {
        rect.x = processedNode.x;
        rect.y = processedNode.y;
      }

      // Create image fill
      const imageHash = figma.createImage(pngData).hash;
      rect.fills = [{
        type: 'IMAGE',
        scaleMode: 'FILL',
        imageHash: imageHash
      }];

      // Copy properties safely
      rect.name = (processedNode.name || "Layer") + " (Flattened PNG)";
      if (typeof processedNode.opacity === 'number') {
        rect.opacity = processedNode.opacity;
      }
      if (processedNode.effects && Array.isArray(processedNode.effects)) {
        rect.effects = processedNode.effects;
      }
      if (processedNode.blendMode) {
        rect.blendMode = processedNode.blendMode;
      }

      // Add to parent
      if (processedNode.parent) {
        processedNode.parent.appendChild(rect);
      }

      // Remove original if not retaining
      if (!retainOriginal && processedNode.parent) {
        processedNode.remove();
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
    const nodes = figma.currentPage.selection;
    
    if (nodes.length === 0) {
      figma.notify('Please select a layer to flatten');
      figma.ui.postMessage({ type: 'complete' }); // Send completion message
      return;
    }

    try {
      for (const node of nodes) {
        if (msg.format === 'vector') {
          if (msg.quality === 'preserved') {
            // Preserved mode: Convert to SVG without flattening
            await convertToSvgPreserved(node, msg.retainOriginal);
          } else {
            // Flattened mode: Use existing flatten logic
            await convertToSvg(node, msg.retainOriginal);
          }
        } else {
          // PNG mode with quality settings
          const scale = msg.quality === 'default' ? 2 : 
                       msg.quality === 'high' ? 3 : 4;
          await flattenToPNG(node, msg.retainOriginal, scale);
        }
      }
      figma.notify('Process completed successfully');
      figma.ui.postMessage({ type: 'complete' }); // Send completion message
    } catch (error) {
      console.error('Process failed:', error);
      figma.notify('Process failed: ' + error.message);
      figma.ui.postMessage({ type: 'complete' }); // Send completion message even on error
    }
  }
};
