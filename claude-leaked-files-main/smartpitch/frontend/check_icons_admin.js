import * as icons from 'hugeicons-react';
const keys = Object.keys(icons);
const search = ['Building', 'User', 'Money', 'Settings', 'Logout', 'Dashboard', 'Presentation'];
search.forEach(s => {
  const matches = keys.filter(k => k.toLowerCase().includes(s.toLowerCase()));
  console.log(`${s}: ${matches.slice(0, 5).join(', ')}`);
});
