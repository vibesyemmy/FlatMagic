figma.showUI(`
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  body {
    margin: 0;
    padding: 0;
    width: 320px;
    height: 320px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #1E1E1E;
    color: #fff;
    overflow: hidden;
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  * {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .Content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
    box-sizing: border-box;
    background: #1E1E1E;
  }

  h1 {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
    align-self: flex-start;
    padding-top: 32px;
    margin-bottom: 16px;
  }

  .info-section {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.8);
    align-self: flex-start;
    font-weight: 400;
    font-size: 12px;
  }

  .info-icon {
    min-width: 20px;
    min-height: 20px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .info-icon svg {
    min-width: 20px;
    min-height: 20px;
    width: 20px;
    height: 20px;
    opacity: 0.8;
  }

  .container {
    background: rgba(98, 98, 98, 0.2);
    padding: 24px 16px;
    border-radius: 8px;
    width: calc(100% - 32px);
    display: flex;
    flex-direction: column;
    gap: 24px;
    align-self: stretch;
    border: 1px solid #3E3E3E;
    outline: none;
    box-shadow: none;
  }

  .checkbox-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .checkbox-wrapper input[type="checkbox"] {
    width: 24px;
    height: 24px;
    margin: 0;
  }

  .checkbox-wrapper label {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.8);
  }

  input[type="checkbox"] {
    border-radius: 4px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    appearance: none;
    background: transparent;
    cursor: pointer;
  }

  input[type="checkbox"]:checked {
    background: #18A0FB;
    border-color: #18A0FB;
    position: relative;
  }

  input[type="checkbox"]:checked::after {
    content: '';
    position: absolute;
    left: 6px;
    top: 2px;
    width: 6px;
    height: 12px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  label {
    font-size: 14px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.9);
  }

  button {
    width: 100%;
    padding: 12px 24px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(180deg, #18A0FB 0%, #0D8EE0 100%);
    color: white;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  button:hover {
    opacity: 0.9;
  }

  button:disabled {
    background: rgba(255, 255, 255, 0.1);
    cursor: not-allowed;
    opacity: 1;
  }

  .footer {
    margin-top: auto;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    padding-bottom: 8px;
  }

  .footer a {
    color: #18A0FB;
    text-decoration: none;
  }

  .footer a:hover {
    color: #0D8EE0;
    text-decoration: underline;
  }
</style>

<div class="Content">
  <h1>FlatMagic</h1>
  
  <div class="info-section">
    <div class="info-icon">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V9H11V15ZM11 7H9V5H11V7Z" fill="white"/>
      </svg>
    </div>
    <span>Select a frame or group to flatten.</span>
  </div>

  <div class="container">
    <div class="checkbox-wrapper">
      <input type="checkbox" id="retain" checked />
      <label for="retain">Retain original frame</label>
    </div>
    <button id="flattenBtn">Flatten Selection</button>
  </div>

  <div class="footer">
    Made with ❤️ by <a href="https://opeyemi.design" target="_blank">Opeyemi Ajagbe</a>
  </div>
</div>

<script>
window.onmessage = async (event) => {
  const msg = event.data.pluginMessage;
  if (msg.type === 'selectionChange') {
    const button = document.getElementById('flattenBtn');
    button.disabled = !msg.hasValidSelection;
  }
};

document.getElementById('flattenBtn').onclick = () => {
  const retainOriginal = document.getElementById('retain').checked;
  parent.postMessage({ pluginMessage: { type: 'flatten', retainOriginal } }, '*');
};
</script>
`, {
  width: 320,
  height: 320
});

// Handle selection changes
figma.on('selectionchange', () => {
  const selection = figma.currentPage.selection;
  const hasValidSelection = selection.length > 0 && (
    selection[0].type === "FRAME" || 
    selection[0].type === "GROUP"
  );
  
  figma.ui.postMessage({
    type: 'selectionChange',
    hasValidSelection
  });
});

// Initial selection check
const selection = figma.currentPage.selection;
const hasValidSelection = selection.length > 0 && (
  selection[0].type === "FRAME" || 
  selection[0].type === "GROUP"
);

figma.ui.postMessage({
  type: 'selectionChange',
  hasValidSelection
});

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'flatten') {
    const selection = figma.currentPage.selection;
    
    if (selection.length === 0) {
      figma.notify('Please select a frame or group to flatten');
      return;
    }

    for (const node of selection) {
      if (node.type === "FRAME" || node.type === "GROUP") {
        try {
          // Use the node's own dimensions and position
          const width = node.width;
          const height = node.height;
          
          // Determine scale based on size
          let scale = 4;
          if (width > 1500 || height > 1500) {
            scale = 1;
          } else if (width > 1000 || height > 1000) {
            scale = 2;
          }

          // Export the frame
          const bytes = await node.exportAsync({
            format: "PNG",
            constraint: { type: "SCALE", value: scale }
          });

          // Create a new rectangle with the image
          const rect = figma.createRectangle();
          const image = figma.createImage(bytes);
          
          // Set exact dimensions from original
          rect.resize(width, height);
          rect.fills = [{ 
            type: "IMAGE", 
            imageHash: image.hash, 
            scaleMode: "FILL" 
          }];
          rect.name = node.name + " (Flattened)";

          // Position the new rectangle
          if (msg.retainOriginal) {
            // If retaining, place flattened version to the right of original
            rect.x = node.x + node.width + 100;
            rect.y = node.y;
          } else {
            // If not retaining, place flattened version at original position
            rect.x = node.x;
            rect.y = node.y;
            // Remove the original
            node.remove();
          }

          // Add the flattened version to the same parent
          node.parent.appendChild(rect);

          figma.notify("Flattened successfully! 🎉");
        } catch (error) {
          console.error("Error flattening:", error);
          figma.notify("Error flattening: " + error.message);
        }
      } else {
        figma.notify("Please select a frame or group");
      }
    }
  }
};
