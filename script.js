import { FileSystem } from './fileSystem.js';
import { FileUploader } from './fileUploader.js';
import { Downloader } from './downloader.js';
import { DragDropHandler } from './dragDropHandler.js';

const fs = new FileSystem();
const uploader = new FileUploader(fs);
const downloader = new Downloader(fs);
const dragDrop = new DragDropHandler(fs);
let currentPath = '/';

// Check if we're in shared mode
const urlParams = new URLSearchParams(window.location.search);
const sharedState = urlParams.get('share');
if (sharedState) {
  try {
    const decodedState = decodeURIComponent(atob(sharedState));
    fs.importState(decodedState);
    fs.setReadOnlyMode(true);
    document.querySelector('.edit-controls').style.display = 'none';
  } catch (error) {
    console.error('Failed to load shared state:', error);
  }
}

function updateUI() {
  const currentFolder = fs.navigateToPath(currentPath);
  const content = document.getElementById('content');
  const pathElement = document.getElementById('current-path');
  
  pathElement.textContent = currentPath || '/';
  content.innerHTML = '';
  
  for (const [name, item] of Object.entries(currentFolder.children)) {
    const div = document.createElement('div');
    div.className = 'item';
    div.draggable = !fs.isReadOnly();
    div.dataset.name = name;
    div.dataset.type = item.type;
    
    const isImage = item.type === 'file' && item.fileType?.startsWith('image/');
    const icon = item.type === 'folder' ? '📁' : (isImage ? '🖼️' : '📄');
    
    const downloadBtn = `<button onclick="event.stopPropagation(); downloadItem('${item.type}', '${name}')">⬇️</button>`;
    const renameBtn = fs.isReadOnly() ? '' : `<button onclick="event.stopPropagation(); rename('${name}')">✏️</button>`;
    
    div.innerHTML = `
      <span class="icon">${icon}</span>
      <span class="name">${name}</span>
      ${downloadBtn}
      ${renameBtn}
    `;
    
    if (item.type === 'folder') {
      div.addEventListener('click', () => {
        currentPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
        updateUI();
      });
      
      if (!fs.isReadOnly()) {
        dragDrop.setupDropZone(div, `${currentPath === '/' ? '' : currentPath}/${name}`);
      }
    } else if (isImage) {
      div.addEventListener('click', () => {
        showPreview(item);
      });
    }
    
    if (!fs.isReadOnly()) {
      dragDrop.setupDraggable(div);
    }
    
    content.appendChild(div);
  }
  
  if (!fs.isReadOnly()) {
    dragDrop.setupDropZone(content, currentPath);
  }
}

function createItem(type) {
  if (fs.isReadOnly()) return;
  
  const name = prompt(`Enter ${type} name:`);
  if (!name) return;
  
  if (type === 'folder') {
    fs.createFolder(currentPath, name);
  } else {
    fs.createFile(currentPath, name);
  }
  
  updateUI();
}

function rename(oldName) {
  if (fs.isReadOnly()) return;
  
  const newName = prompt('Enter new name:', oldName);
  if (!newName || newName === oldName) return;
  
  fs.rename(currentPath, oldName, newName);
  updateUI();
}

function goBack() {
  if (currentPath === '/') return;
  
  const parts = currentPath.split('/').filter(Boolean);
  parts.pop();
  currentPath = parts.length ? '/' + parts.join('/') : '/';
  updateUI();
}

async function handleFileUpload(event) {
  if (fs.isReadOnly()) return;
  
  const files = event.target.files;
  if (!files.length) return;
  
  await uploader.handleFileUpload(files, currentPath);
  updateUI();
  
  // Reset input to allow uploading the same file again
  event.target.value = '';
}

function downloadItem(type, name) {
  const item = fs.navigateToPath(currentPath).children[name];
  if (!item) return;
  
  if (type === 'folder') {
    downloader.downloadFolder(currentPath + '/' + name, name);
  } else {
    downloader.downloadFile(item);
  }
}

function showPreview(item) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <img src="${item.content}" alt="${item.name}" />
    </div>
  `;
  
  modal.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  document.body.appendChild(modal);
}

function generateShareLink() {
  const state = fs.exportState();
  const encoded = btoa(encodeURIComponent(state));
  const url = new URL(window.location.href);
  url.searchParams.set('share', encoded);
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Share Link</h2>
      <input class="share-link" type="text" value="${url.href}" readonly />
      <p>Anyone with this link can view and download files but cannot modify them.</p>
    </div>
  `;
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
  
  const input = modal.querySelector('input');
  input.addEventListener('click', () => {
    input.select();
    document.execCommand('copy');
  });
  
  document.body.appendChild(modal);
}

// Export functions for HTML access
window.createItem = createItem;
window.rename = rename;
window.goBack = goBack;
window.handleFileUpload = handleFileUpload;
window.downloadItem = downloadItem;
window.generateShareLink = generateShareLink;

// Initial render
updateUI();