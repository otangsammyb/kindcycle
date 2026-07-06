import * as icons from 'hugeicons-react';
const keys = Object.keys(icons);
const search = ['Rocket', 'Launch', 'Code', 'Presentation', 'Dashboard', 'Settings', 'Logout', 'Mail', 'View', 'Github', 'Tick', 'Check', 'Alert', 'Save', 'Refresh', 'Disk'];
const results = {};
search.forEach(s => {
  results[s] = keys.filter(k => k.toLowerCase().includes(s.toLowerCase()));
});
console.log(results);
