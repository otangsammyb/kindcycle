import * as icons from 'hugeicons-react';
const keys = Object.keys(icons);
const search = ['Layout', 'Refresh', 'Arrow', 'Presentation', 'Dashboard', 'Check', 'Tick'];
search.forEach(s => {
  const matches = keys.filter(k => k.toLowerCase().includes(s.toLowerCase()));
  console.log(`${s}: ${matches.slice(0, 10).join(', ')}`);
});
