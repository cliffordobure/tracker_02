/**
 * Converts relative photo paths to full absolute URLs
 * @param {string|null|undefined} photoPath - Photo path from database (can be null, undefined, or empty)
 * @returns {string|null} - Full URL or null if no photo
 */
function getPhotoUrl(photoPath) {
  // Base URL (without /api)
  const BASE_URL = process.env.BASE_URL || 'https://tracker-02.onrender.com';
  
  // If no photo path, return null
  if (!photoPath || photoPath.trim() === '' || photoPath === 'null') {
    return null;
  }
  
  // If already a full URL (starts with http:// or https://), return as is
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath;
  }
  
  // If it's a relative path starting with /, prepend base URL
  if (photoPath.startsWith('/')) {
    return `${BASE_URL}${photoPath}`;
  }
  
  // If it's just a filename, assume it's in /uploads/ directory
  return `${BASE_URL}/uploads/${photoPath}`;
}

module.exports = {
  getPhotoUrl
};

