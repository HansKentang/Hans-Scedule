const fs = require('fs');
['shared.js'].forEach(function(f) {
  try { new Function(fs.readFileSync(f,'utf8')); console.log(f+': JS OK'); }
  catch(e) { console.log(f+': ERROR: '+e.message.replace(/\n/g,' | ')); }
});
['index.html','schedule.html','activities.html','analytics.html','goals.html','finance.html','gallery.html','friends.html'].forEach(function(f) {
  var html = fs.readFileSync(f,'utf8');
  if (html.indexOf('<!DOCTYPE html>') === 0 && html.indexOf('</html>') > 0) {
    var matches = html.match(/data-i18n="[^"]*">/g);
    console.log(f+': HTML OK ('+(matches?matches.length:0)+' data-i18n attrs)');
  } else {
    console.log(f+': HTML SUSPICIOUS');
  }
});
