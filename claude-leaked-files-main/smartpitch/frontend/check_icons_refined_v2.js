import * as icons from 'hugeicons-react';
const keys = Object.keys(icons);
const search = ['Rocket', 'Code', 'Presentation', 'Dashboard', 'Settings', 'Logout', 'Mail', 'View', 'Github', 'Tick', 'Check', 'Alert', 'Artificial', 'Save', 'Refresh', 'Disk'];
search.forEach(s => {
  const matches = keys.filter(k => k.toLowerCase().includes(s.toLowerCase()));
  console.log(`${s}: ${matches.slice(0, 5).join(', ')}`);
});
