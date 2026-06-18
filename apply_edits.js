const fs = require('fs');
let content = fs.readFileSync('shared.js', 'utf-8');

// 1) Add applyImages() call in loadImages()
content = content.replace(
  'function loadImages() {\n  state.images = { ...DEFAULT_IMAGES };\n  try { restoreDirectImageKeys(); } catch(e) { /* skip */ }\n}',
  'function loadImages() {\n  state.images = { ...DEFAULT_IMAGES };\n  try { restoreDirectImageKeys(); } catch(e) { /* skip */ }\n  // After restoring, re-apply images to the DOM in case DOM is ready\n  try { applyImages(); } catch(e) { /* DOM may not be ready yet */ }\n}'
);

// 2) Add applyImages() function before restoreDirectImageKeys
content = content.replace(
  'function restoreDirectImageKeys() {\n  var _found = 0;',
  '// --- APPLY IMAGES TO DOM ---\nfunction applyImages() {\n  document.querySelectorAll("img[data-image-id]").forEach(function(el) {\n    var _id = el.dataset.imageId;\n    if (_id) {\n      el.src = getImage(_id) || "";\n      el.style.display = el.src ? "block" : "none";\n    }\n  });\n}\n\nfunction restoreDirectImageKeys() {\n  var _found = 0;'
);

// 3) Add error handling to setImage
content = content.replace(
  "  try { localStorage.setItem('haven-image-' + id, url); } catch(e) { /* skip */ }",
  "  try { localStorage.setItem('haven-image-' + id, url); } catch(e) {\n    console.warn('[img] localStorage quota may be exceeded for image:', id, e);\n    if (typeof showToast === 'function') showToast('Could not save image: localStorage full. Try a smaller image.', 'error', 4000);\n  }"
);

// 4) Add resizeImageDataUrl before handleImagePickerPaste
content = content.replace(
  'function handleImagePickerPaste(e) {\n  const status = document.getElementById',
  '// --- IMAGE COMPRESSION ---\nfunction resizeImageDataUrl(dataUrl, maxWidth, maxHeight, quality) {\n  return new Promise(function(resolve) {\n    var img = new Image();\n    img.onload = function() {\n      var w = img.width, h = img.height;\n      if (w <= maxWidth && h <= maxHeight) {\n        resolve(dataUrl);\n        return;\n      }\n      var ratio = Math.min(maxWidth / w, maxHeight / h, 1);\n      var cw = Math.round(w * ratio);\n      var ch = Math.round(h * ratio);\n      var canvas = document.createElement("canvas");\n      canvas.width = cw;\n      canvas.height = ch;\n      var ctx = canvas.getContext("2d");\n      ctx.imageSmoothingEnabled = true;\n      ctx.imageSmoothingQuality = "high";\n      ctx.drawImage(img, 0, 0, cw, ch);\n      var resized = canvas.toDataURL("image/jpeg", quality || 0.82);\n      resolve(resized);\n    };\n    img.onerror = function() { resolve(dataUrl); };\n    img.src = dataUrl;\n  });\n}\n\nfunction handleImagePickerPaste(e) {\n  const status = document.getElementById'
);

// 5) Modify handleImagePickerPaste to use resize
// Find the paste section by looking for marker text
var markerA = '      const reader = new FileReader();';
var markerB = '      reader.readAsDataURL(blob);';
var startIdx = content.indexOf(markerA);
var endIdx = content.indexOf(markerB, startIdx) + markerB.length;

if (startIdx >= 0 && endIdx > startIdx) {
  var oldBlock = content.slice(startIdx, endIdx + 1); // include trailing newline
  var newBlock = [
    '      if (status) { status.textContent = "Processing image..."; status.style.color = "var(--text-tertiary)"; }',
    '      const reader = new FileReader();',
    '      reader.onload = function(ev) {',
    '        var fullDataUrl = ev.target.result;',
    '        // Resize to max 800px to keep localStorage usage manageable',
    '        resizeImageDataUrl(fullDataUrl, 800, 800, 0.78).then(function(resizedUrl) {',
    '          if (preview) preview.src = resizedUrl;',
    '          if (preview) preview.style.display = "block";',
    '          if (preview) preview.dataset.pasted = resizedUrl;',
    '          if (status) { status.textContent = "Image loaded — click Save to apply"; status.style.color = "var(--primary)"; }',
    '          // Clear URL input so pasted image takes priority in handleImagePickerSave',
    '          var _urlInput = document.getElementById("imagePickerUrl");',
    '          if (_urlInput) _urlInput.value = "";',
    '        });',
    '      };',
    '      reader.readAsDataURL(blob);',
    '      return;',
    '    }'
  ].join('\n');
  content = content.slice(0, startIdx) + newBlock + content.slice(endIdx + 1);
}

// Report
console.log('Replacement 1 (loadImages):', content.includes('After restoring, re-apply images') ? 'OK' : 'FAIL');
console.log('Replacement 2 (applyImages fn):', content.includes('APPLY IMAGES TO DOM') ? 'OK' : 'FAIL');
console.log('Replacement 3 (setImage error):', content.includes('localStorage quota may be exceeded') ? 'OK' : 'FAIL');
console.log('Replacement 4 (resizeImage fn):', content.includes('IMAGE COMPRESSION') ? 'OK' : 'FAIL');
console.log('Replacement 5 (paste resize):', content.includes('Processing image') ? 'OK' : 'FAIL');

fs.writeFileSync('shared.js', content, 'utf-8');
console.log('Written successfully');
