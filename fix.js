const fs = require('fs');
const file = 'functions/komunitas/c/[id].js';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /: "";\n        \? `<div class="event-status"/g,
  ': "";\n      const statusBadge = sponsorLogos.length\n        ? `<div class="event-status"'
);
fs.writeFileSync(file, code);
