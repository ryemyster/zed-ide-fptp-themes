const fs = require('fs');
const path = require('path');

const THEMES_DIR = path.resolve(__dirname, '../themes');
const files = fs.readdirSync(THEMES_DIR).filter(f => f.endsWith('.json'));

files.forEach(file => {
  const filepath = path.join(THEMES_DIR, file);
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  let modified = false;

  data.themes.forEach(theme => {
    const name = theme.name;
    const style = theme.style || {};

    if (name === 'Pixels to Punk Brand Dark') {
      style['terminal.ansi.black'] = '#827a8d';
      style['terminal.ansi.blue'] = '#4454ff';
      style['terminal.ansi.bright_black'] = '#7d6fd3';
      modified = true;
    } else if (name === 'Pixels to Punk Brand Light') {
      style['terminal.ansi.white'] = '#706e74';
      style['terminal.ansi.bright_white'] = '#6e6e6e';
      modified = true;
    } else if (name === 'Pixels to Punk NieR: Automata') {
      style['terminal.ansi.black'] = '#797978';
      style['terminal.ansi.bright_black'] = '#7e7872';
      modified = true;
    } else if (name === 'Pixels to Punk NieR: Automata Light') {
      style['terminal.background'] = '#f5f0e8';
      style['terminal.foreground'] = '#201810';
      style['terminal.ansi.black'] = '#201810';
      style['terminal.ansi.red'] = '#a01818';
      style['terminal.ansi.green'] = '#488820';
      style['terminal.ansi.yellow'] = '#907020';
      style['terminal.ansi.blue'] = '#2060a8';
      style['terminal.ansi.magenta'] = '#804098';
      style['terminal.ansi.cyan'] = '#208078';
      style['terminal.ansi.white'] = '#706d6a';
      style['terminal.ansi.bright_black'] = '#8a8070';
      style['terminal.ansi.bright_red'] = '#b02020';
      style['terminal.ansi.bright_green'] = '#589830';
      style['terminal.ansi.bright_yellow'] = '#a08030';
      style['terminal.ansi.bright_blue'] = '#3070b8';
      style['terminal.ansi.bright_magenta'] = '#9050a8';
      style['terminal.ansi.bright_cyan'] = '#309088';
      style['terminal.ansi.bright_white'] = '#6d6d6d';
      modified = true;
    } else if (name === 'Pixels to Punk Stellar Blade') {
      style['terminal.ansi.black'] = '#78787b';
      style['terminal.ansi.bright_black'] = '#767887';
      modified = true;
    } else if (name === 'Pixels to Punk Stellar Blade Light') {
      style['terminal.background'] = '#f7f2fc';
      style['terminal.foreground'] = '#1a1824';
      style['terminal.ansi.black'] = '#1a1824';
      style['terminal.ansi.red'] = '#d82246';
      style['terminal.ansi.green'] = '#1da880';
      style['terminal.ansi.yellow'] = '#c88424';
      style['terminal.ansi.blue'] = '#3e60c8';
      style['terminal.ansi.magenta'] = '#c81d60';
      style['terminal.ansi.cyan'] = '#009cb5';
      style['terminal.ansi.white'] = '#716f74';
      style['terminal.ansi.bright_black'] = '#847c9c';
      style['terminal.ansi.bright_red'] = '#e83256';
      style['terminal.ansi.bright_green'] = '#2db890';
      style['terminal.ansi.bright_yellow'] = '#d89434';
      style['terminal.ansi.bright_blue'] = '#4e70d8';
      style['terminal.ansi.bright_magenta'] = '#d82d70';
      style['terminal.ansi.bright_cyan'] = '#10acc5';
      style['terminal.ansi.bright_white'] = '#6f6f6f';
      modified = true;
    } else if (name === 'Pixels to Punk Tales of Arise') {
      style['terminal.ansi.black'] = '#787a7d';
      style['terminal.ansi.bright_black'] = '#7c7888';
      modified = true;
    } else if (name === 'Pixels to Punk HAGANE Day Shift') {
      style['terminal.ansi.black'] = '#1a2035';
      style['terminal.ansi.bright_black'] = '#505a70';
      modified = true;
    } else if (name === 'Pixels to Punk Light') {
      style['terminal.ansi.white'] = '#6f7075';
      style['terminal.ansi.bright_white'] = '#707070';
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n');
    console.log(`✓ Fixed manual theme: ${file}`);
  }
});
