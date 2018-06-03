const music = require('./music');

const pc = new music.PitchClass(music.letterNames.C);
const pc2= new music.PitchClass(music.letterNames.G, 1);
const note = new music.Note(pc);
const note2 = new music.Note(pc2, 5);
console.log(note.difference(note2));
