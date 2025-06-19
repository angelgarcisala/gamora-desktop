console.log('[TEST] Ejecutando desde Node:', typeof require !== 'undefined');
console.log('[TEST] ¿Existe fs?:', (() => {
  try {
    require('fs');
    return true;
  } catch {
    return false;
  }
})());

console.log('[TEST] ¿Estamos en Electron?:', !!process.versions?.electron);
