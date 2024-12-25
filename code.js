// Show UI
figma.showUI(__html__, {
  width: 320,
  height: 400,
  themeColors: true
});

// Check if current selection is valid and get frame size info
function checkSelection() {
  const selection = figma.currentPage.selection;
  const hasValidSelection = selection.length === 1 && (selection[0].type === "FRAME" || selection[0].type === "GROUP");
  
  let isLargeFrame = false;
  if (hasValidSelection) {
    const node = selection[0];
    isLargeFrame = node.width > 4000 || node.height > 4000;
  }
  
  return {
    hasValidSelection,
    isLargeFrame
  };
}

// Initial selection check
figma.ui.postMessage({
  type: 'selectionchange',
  ...checkSelection()
});

// Listen for selection changes
figma.on('selectionchange', () => {
  figma.ui.postMessage({
    type: 'selectionchange',
    ...checkSelection()
  });
});

async function flattenToSVG(node, retainOriginal) {
  try {
    // Create a frame to preserve background properties
    const frame = figma.createFrame();
    frame.x = retainOriginal ? node.x + node.width + 100 : node.x;
    frame.y = node.y;
    frame.resize(node.width, node.height);
    
    // Copy background properties if original is a frame
    if (node.type === "FRAME") {
      frame.fills = JSON.parse(JSON.stringify(node.fills || []));
      frame.strokes = JSON.parse(JSON.stringify(node.strokes || []));
      frame.strokeWeight = node.strokeWeight;
      frame.strokeAlign = node.strokeAlign;
      frame.strokeCap = node.strokeCap;
      frame.strokeJoin = node.strokeJoin;
      frame.dashPattern = node.dashPattern;
      frame.cornerRadius = node.cornerRadius;
    }

    // Add to the same parent as original node
    if (node.parent) {
      node.parent.appendChild(frame);
    }

    // Clone the original node's children into the new frame
    if (node.type === "FRAME") {
      for (const child of node.children) {
        const clone = child.clone();
        frame.appendChild(clone);
      }
    } else {
      const clone = node.clone();
      frame.appendChild(clone);
    }

    // Flatten the frame with its contents
    const flattened = figma.flatten([frame]);
    flattened.name = node.name + " (Flattened Vector)";

    return flattened;
  } catch (error) {
    console.error('Vector flattening failed:', error);
    figma.notify('Vector flattening failed. Try PNG format instead.');
    return null;
  }
}

figma.ui.onmessage = async msg => {
  if (msg.type === 'flatten') {
    const selection = figma.currentPage.selection;
    
    if (selection.length > 0) {
      const node = selection[0];
      
      // Check if frame is large (> 4000px in either dimension)
      const isLargeFrame = node.width > 4000 || node.height > 4000;
      
      // Use default quality (2) for large frames, otherwise use selected quality
      const quality = isLargeFrame ? 2 : msg.quality;
      
      if (isLargeFrame) {
        figma.notify("Large frame detected - using default quality for better performance", { timeout: 2000 });
      }
      
      try {
        if (msg.format === 'SVG') {
          const flattenedVector = await flattenToSVG(node, msg.retainOriginal);
          if (flattenedVector) {
            if (!msg.retainOriginal) {
              node.remove();
            }
            figma.notify("Successfully flattened to vector");
          }
        } else {
          // PNG flattening logic
          const bytes = await node.exportAsync({
            format: 'PNG',
            constraint: { type: 'SCALE', value: quality }
          });

          const image = figma.createImage(bytes);
          const rect = figma.createRectangle();
          
          rect.resize(node.width, node.height);
          
          // Position the rectangle
          if (msg.retainOriginal) {
            rect.x = node.x + node.width + 100; // 100px to the right
            rect.y = node.y;
          } else {
            rect.x = node.x;
            rect.y = node.y;
          }
          
          rect.fills = [{
            type: 'IMAGE',
            imageHash: image.hash,
            scaleMode: 'FILL'
          }];
          rect.name = node.name + " (Flattened)";
          
          if (node.parent && node.parent.type !== 'PAGE') {
            node.parent.appendChild(rect);
          }
          
          if (!msg.retainOriginal) {
            node.remove();
          }
          
          figma.notify("Successfully flattened to PNG");
        }
      } catch (error) {
        console.error('Flattening failed:', error);
        figma.notify("Error: Flattening failed");
      }
    } else {
      figma.notify("Please select a frame or group");
    }
    // After flattening is complete
    figma.ui.postMessage({ type: 'complete' });
  }
};
