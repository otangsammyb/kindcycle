import * as icons from 'hugeicons-react';
const keys = Object.keys(icons);
const search = ['Refresh', 'Arrow', 'Update', 'Reload', 'Cycle', 'Sync', 'Loading'];
search.forEach(s => {
  const matches = keys.filter(k => k.toLowerCase().includes(s.toLowerCase()));
  console.log(`${s}: ${matches.slice(0, 10).join(', ')}`);
});
console.log('ArrowPathIcon exists?', keys.includes('ArrowPathIcon'));
