import WDK from '@tetherto/wdk';
const phrase = WDK.getRandomSeedPhrase();
console.log('Generated mnemonic (keep secret!):');
console.log(phrase);
