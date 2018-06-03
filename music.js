/* a library for representing musical constructs based on music theory */



/* UTIL! */

// lookup table mapping diatonic classes to chromatic classes
const chromaticClasses = {
	1: 0,
	2: 2,
	3: 4,
	4: 5,
	5: 7,
	6: 9,
	7: 11,
}

// modulo that works with negatives
function mod(n, m) {
	while(n < 0) n += m;
	return n % m;
}

// return a number representing the diatonic class of a diatonic value
// (a diatonic modulo 8)
// (i.e. values > 7 are wrapped back to 1, 8 is diatonically equal to 1)
function getDiatonicClass(diatonicValue) {
	return mod((diatonicValue - 1), 7) + 1;
}

// just a mod 12
function getChromaticClass(chromaticValue) {
	return mod(chromaticValue, 12);
}

// extract the octave from a diatonic value
function getDiatonicOctave(diatonicValue) {
	return Math.floor((diatonicValue - 1) / 7);
}

// extract the octave from a chromatic value
function getChromaticOctave(chromaticValue) {
	return Math.floor(chromaticValue / 12);
}

// convert diatonic value to a chromatic value
function getChromaticValue(diatonicValue) {
	let octave = getDiatonicOctave(diatonicValue);
	let diatonicClass = getDiatonicClass(diatonicValue);
	let chromaticClass = chromaticClasses[diatonicClass];
	return octave * 12 + chromaticClass;
}

// add two diatonic values
function diatonicAdd(a, b) {
	return a + b - 1;
}

// subtract two diatonic values
function diatonicSubtract(a, b) {
	return a - b + 1;
}

// fix negative diatonic values
function diatonicNormalize(value) {
	return Math.abs(value - 1) + 1;
}

// fix negative chromatic values
function chromaticNormalize(value) {
	return Math.abs(value);
}




/* NOTES! */

// note letter names
// diatonic value is number identifying its position in a diatonic scale (1 thru 7)
class LetterName {
	constructor(letter='c', diatonicValue=1) {
		this.letter = letter;
		this.diatonicValue = diatonicValue;
	}

	get chromaticValue() {
		return getChromaticValue(this.diatonicValue);
	}

	static fromDiatonicValue(value) {
		return diatonicClasses[getDiatonicClass(value)];
	}
}

// letter name enumeration of singletons
const letterNames = {
	C: new LetterName('c', 1),
	D: new LetterName('d', 2),
	E: new LetterName('e', 3),
	F: new LetterName('f', 4),
	G: new LetterName('g', 5),
	A: new LetterName('a', 6),
	B: new LetterName('b', 7),
}

// lookup letter names by diatonic value
const diatonicClasses = {
	1: letterNames.C,
	2: letterNames.D,
	3: letterNames.E,
	4: letterNames.F,
	5: letterNames.G,
	6: letterNames.A,
	7: letterNames.B,
}

// pitch classes
// (chromatic offset is how sharp or flat, e.g. 1 is sharp, 2 is double shorp, -1 is flat, etc)
class PitchClass {
	constructor(letterName=letterNames.C, chromaticOffset=0) {
		this.letterName = letterName;
		this.chromaticOffset = chromaticOffset;
	}

	get diatonicValue() {
		return this.letterName.diatonicValue;
	}

	get chromaticValue() {
		return this.letterName.chromaticValue + this.chromaticOffset;
	}

	static fromDiatonicValue(value, offset=0) {
		return new PitchClass(LetterName.fromDiatonicValue(value), offset);
	}

	static fromValues(diatonicValue, chromaticValue) {
		const offset = chromaticValue - getChromaticValue(diatonicValue);
		return PitchClass.fromDiatonicValue(diatonicValue, offset);
	}
}

// musical notes
class Note {
	constructor(pitchClass=new PitchClass(), octave=4) {
		this.pitchClass = pitchClass;
		this.octave = octave;
	}

	get diatonicValue() {
		return this.pitchClass.diatonicValue + this.octave * 7;
	}

	get chromaticValue() {
		return this.pitchClass.chromaticValue + this.octave * 12;
	}

	static fromValues(diatonicValue, chromaticValue) {
		const diatonicClass = getDiatonicClass(diatonicValue);
		const octave = getDiatonicOctave(diatonicValue);
		const targetPitchClassChromaticValue = chromaticValue - octave * 12;
		const pitchClass = PitchClass.fromValues(diatonicClass, targetPitchClassChromaticValue);
		return new Note(pitchClass, octave);
	}

	above(interval) {
		const diatonicValue = diatonicAdd(this.diatonicValue, interval.number);
		const chromaticValue = this.chromaticValue + interval.chromaticValue;
		return Note.fromValues(diatonicValue, chromaticValue);
	}

	below(interval) {
		const diatonicValue = diatonicSubtract(this.diatonicValue, interval.number);
		const chromaticValue = this.chromaticValue - interval.chromaticValue;
		return Note.fromValues(diatonicValue, chromaticValue);
	}

	static difference(a, b) {
		const diatonicValue = diatonicSubtract(b.diatonicValue, a.diatonicValue);
		const chromaticValue = b.chromaticValue - a.chromaticValue;
		return Interval.fromChromaticValue(diatonicValue, chromaticValue);
	}

	difference(a) {
		return Note.difference(this, a);
	}
}



/* INTERVALS! */

// interval quality type enumeration
const intervalQualityTypes = {
	PERFECT: 'perfect',
	AUGMENTED: 'augmented',
	DIMINISHED: 'diminished',
	MAJOR: 'major',
	MINOR: 'minor',
}

// interval qualities
// coefficient is because augmented or diminished qualities can be multiplied (e.g. doubly diminished, triply augmented, etc.)
class IntervalQuality {
	constructor(type=intervalQualityTypes.PERFECT, coefficient=1) {
		this.type = type;
		this.coefficient = coefficient;
	}

	// type is perfect type or major type
	static newQualityWithOffset(intervalType, offset) {
		switch(intervalType) {
			case intervalTypes.PERFECT:
				if(offset == 0) return new IntervalQuality(intervalQualityTypes.PERFECT);
				else if(offset > 0) return new IntervalQuality(intervalQualityTypes.AUGMENTED, offset);
				else if(offset < 0) return new IntervalQuality(intervalQualityTypes.DIMINISHED, -offset);
				break;
			case intervalTypes.MAJOR:
				if(offset == 0) return new IntervalQuality(intervalQualityTypes.MAJOR);
				else if(offset > 0) return new IntervalQuality(intervalQualityTypes.AUGMENTED, offset);
				else if(offset == -1) return new IntervalQuality(intervalQualityTypes.MINOR);
				else if(offset < -1) return new IntervalQuality(intervalQualityTypes.DIMINISHED, -offset-1);
				break;
		}
	}
}

// some basic interval qualities as singletons
// you'll still have to construct your own if you want doubly,triply,etc aug/dim qualities!!!
const intervalQualities = {
	PERFECT: new IntervalQuality(type=intervalQualityTypes.PERFECT),
	AUGMENTED: new IntervalQuality(type=intervalQualityTypes.AUGMENTED),
	DIMINISHED: new IntervalQuality(type=intervalQualityTypes.DIMINISHED),
	MAJOR: new IntervalQuality(type=intervalQualityTypes.MAJOR),
	MINOR: new IntervalQuality(type=intervalQualityTypes.MINOR),
}

// whether an intveral is a major/minor type or a perfect type
const intervalTypes = {
	PERFECT: 'perfect',
	MAJOR: 'major',
}

// intervals
// number is diatonic number of the interval (1 = unison, 2 = second, etc.)
// chromatic offset here is the chromatic deviation in semitones from corresponding major and perfect intervals
class Interval {
	constructor(number=1, quality) {
		this.number = number;
		this.quality = quality || new IntervalQuality(this.type); // cheating here
	}

	get type() {
		switch(this.intervalClass) {
			case 1:
			case 4:
			case 5:
				return intervalTypes.PERFECT;
			case 2:
			case 3:
			case 6:
			case 7:
				return intervalTypes.MAJOR;
		}
	}

	get intervalClass() {
		return getDiatonicClass(this.number);
	}


	get chromaticOffset() {
		switch(this.type) {
			case intervalTypes.PERFECT:
				switch(this.quality.type) {
					case intervalQualityTypes.PERFECT:
						return 0;
					case intervalQualityTypes.AUGMENTED:
						return this.quality.coefficient;
					case intervalQualityTypes.DIMINISHED:
						return -this.quality.coefficient;
				}
			case intervalTypes.MAJOR:
				switch(this.quality.type) {
					case intervalQualityTypes.MAJOR:
						return 0;
					case intervalQualityTypes.MINOR:
						return -1;
					case intervalQualityTypes.AUGMENTED:
						return this.quality.coefficient;
					case intervalQualityTypes.DIMINISHED:
						return -(this.quality.coefficient + 1);
				}
		}
	}

	get chromaticValue() {
		return getChromaticValue(this.number) + this.chromaticOffset;
	}

	set chromaticValue(value) {
		const offset = value - getChromaticValue(this.number);
		this.quality = IntervalQuality.newQualityWithOffset(this.type, offset);
	}

	static fromChromaticValue(number, targetChromaticValue) {
		const interval = new Interval(number);
		interval.chromaticValue = targetChromaticValue;
		return interval;
	}

	static add(a, b) {
		return Interval.fromChromaticValue(diatonicAdd(a.number, b.number), a.chromaticValue + b.chromaticValue);
	}

	static subtract(a, b) {
		return Interval.fromChromaticValue(diatonicSubtract(a.number, b.number), a.chromaticValue - b.chromaticValue);
	}

	add(a) {
		return Interval.add(this, a);
	}

	subtract(a) {
		return Interval.subtract(this, a);
	}

	reduce() {
		return Interval.fromChromaticValue(this.intervalClass, getChromaticClass(this.chromaticValue));
	}

	normalize() {
		return Interval.fromChromaticValue(diatonicNormalize(this.number), chromaticNormalize(this.chromaticValue));
	}

	invert() {
		return this.subtract(new Interval(8)).normalize();
	}
}


module.exports = {
	PitchClass: PitchClass,
	Note: Note,
	Interval: Interval,
	IntervalQuality: IntervalQuality,
	intervalTypes: intervalTypes,
	intervalQualities: intervalQualities,
	intervalQualityTypes: intervalQualityTypes,
	letterNames: letterNames,
}
