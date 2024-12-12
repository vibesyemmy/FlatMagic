figma.showUI(__html__);

figma.ui.resize(320, 256);

// Function to check selection and update UI
function updateUIState() {
  const selection = figma.currentPage.selection;
  const hasValidSelection = selection.length > 0 && 
    selection.some(node => node.type === 'FRAME' || node.type === 'GROUP');
  
  figma.ui.postMessage({ 
    type: 'selection-change',
    hasValidSelection
  });
}

// Listen for selection changes
figma.on('selectionchange', updateUIState);

// Initial UI state update
updateUIState();

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'flatten-selection') {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.notify('Please select a frame or group to flatten');
      return;
    }

    for (const node of selection) {
      if (node.type === 'FRAME' || node.type === 'GROUP') {
        try {
          // Create a new frame with the same dimensions and position
          const newFrame = figma.createFrame();
          newFrame.x = node.x;
          newFrame.y = node.y;
          newFrame.resize(node.width, node.height);
          
          // Export the selected node as PNG
          const bytes = await node.exportAsync({
            format: 'PNG',
            constraint: { type: 'SCALE', value: 1 }
          });

          // Create a new image fill
          const image = figma.createImage(bytes);
          
          // Apply the image fill to the new frame
          newFrame.fills = [{
            type: 'IMAGE',
            imageHash: image.hash,
            scaleMode: 'FILL'
          }];

          // Insert the new frame after the original node
          node.parent.insertChild(node.parent.children.indexOf(node) + 1, newFrame);
          
          // Name the new frame
          newFrame.name = `${node.name} (Flattened)`;
          
          // Delete the original node
          node.remove();
          
          figma.notify('Layer flattened successfully!');
        } catch (error) {
          figma.notify('Error flattening layer: ' + error.message);
        }
      } else {
        figma.notify('Please select a frame or group to flatten');
      }
    }
  }
};
