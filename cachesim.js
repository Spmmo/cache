class DirectMappedCache {
  constructor(cacheSize, blockSize) {
    this.cacheSize = cacheSize;
    this.blockSize = blockSize;
    this.numBlocks = cacheSize / blockSize;
    this.offsetBits = Math.floor(Math.log2(blockSize));
    this.indexBits = Math.floor(Math.log2(this.numBlocks));
    this.tagBits = 32 - this.indexBits - this.offsetBits;    
    this.cache = Array.from({ length: this.numBlocks }, () => ({ tag: null, valid: false }));
  }

  accessAddress(address) {
    const offset = address & ((1 << this.offsetBits) - 1);
    const index = (address >> this.offsetBits) & ((1 << this.indexBits) - 1);
    const tag = address >> (this.offsetBits + this.indexBits);

    const hit = this.cache[index].valid && this.cache[index].tag === tag;
    if (!hit) {
      this.cache[index].tag = tag;
      this.cache[index].valid = true;
    }

    return {
      address,
      binAddr: address.toString(2).padStart(32, '0'),
      tag: tag.toString(2).padStart(this.tagBits, '0'),
      index: index.toString(2).padStart(this.indexBits, '0'),
      offset: offset.toString(2).padStart(this.offsetBits, '0'),
      hitMiss: hit ? 'Hit' : 'Miss',
      validBit: hit ? 'Y' : 'N',
    };
  }
}

class FullyAssociativeCache {
  constructor(cacheSize, blockSize) {
    this.cacheSize = cacheSize;
    this.blockSize = blockSize;
    this.numBlocks = cacheSize / blockSize;
    this.offsetBits = Math.floor(Math.log2(blockSize));
    this.tagBits = 32 - this.offsetBits;
    this.cache = new Map();
  }

  accessAddress(address) {
    const offset = address & ((1 << this.offsetBits) - 1);
    const tag = address >> this.offsetBits;
    const hit = this.cache.has(tag);

    if (hit) {
      this.cache.delete(tag);
    } else if (this.cache.size >= this.numBlocks) {
      this.cache.delete(this.cache.keys().next().value); // ลบตัวที่เก่าสุด
    }

    this.cache.set(tag, true);

    return {
      address,
      binAddr: address.toString(2).padStart(32, '0'),
      tag: tag.toString(2).padStart(this.tagBits, '0'),
      index: '-',
      offset: offset.toString(2).padStart(this.offsetBits, '0'),
      hitMiss: hit ? 'Hit' : 'Miss',
      validBit: hit ? 'Y' : 'N',
    };
  }
}

class SetAssociativeCache {
  constructor(cacheSize, blockSize, ways) {
    this.cacheSize = cacheSize;
    this.blockSize = blockSize;
    this.ways = ways;
    this.numSets = Math.floor((cacheSize / blockSize) / ways);
    this.offsetBits = Math.floor(Math.log2(blockSize));
    this.indexBits = Math.floor(Math.log2(this.numSets));
    this.tagBits = 32 - this.indexBits - this.offsetBits;
    this.cache = Array.from({ length: this.numSets }, () => new Map());
  }

  accessAddress(address) {
    const offset = address & ((1 << this.offsetBits) - 1);
    const index = (address >> this.offsetBits) & ((1 << this.indexBits) - 1);
    const tag = address >> (this.offsetBits + this.indexBits);
    const set = this.cache[index];
    const hit = set.has(tag);

    if (hit) {
      set.delete(tag);
    } else if (set.size >= this.ways) {
      set.delete(set.keys().next().value); // ลบตัวที่เก่าสุด
    }

    set.set(tag, true);

    return {
      address,
      binAddr: address.toString(2).padStart(32, '0'),
      tag: tag.toString(2).padStart(this.tagBits, '0'),
      index: index.toString(2).padStart(this.indexBits, '0'),
      offset: offset.toString(2).padStart(this.offsetBits, '0'),
      hitMiss: hit ? 'Hit' : 'Miss',
      validBit: hit ? 'Y' : 'N',
    };
  }
}

function runSimulation(cacheSize, numBlocks, numWordsPerBlock, wordAddrs) {
  const blockSize = numWordsPerBlock * 4; // Assume each word is 4 bytes
  const ways = Math.max(1, Math.min(numBlocks, parseInt(document.getElementById('num-ways').value, 10) || 2));

  let output = '';
  let directHit = 0, directMiss = 0;
  let fullyHit = 0, fullyMiss = 0;
  let setHit = 0, setMiss = 0;

  // Direct-Mapped Cache
  output += 'Direct-Mapped Cache\n' +
            '___________________________________________________________________________________________________________________\n' +
            '\n' +
            ' Word Addr.              Bin Addr.                         Tag            Index    Offset   Hit/Miss    Valid Bit\n' +
            '___________________________________________________________________________________________________________________\n' +
            '\n';
  const directCache = new DirectMappedCache(cacheSize, blockSize);
  for (const addr of wordAddrs) {
    const result = directCache.accessAddress(addr);
    output += `${result.address.toString().padEnd(12)} ${result.binAddr.padEnd(13)} ${result.tag.padEnd(8)} ${result.index.padEnd(8)} ${result.offset.padEnd(8)} ${result.hitMiss.padEnd(11)} ${result.validBit}\n`;
  
    if (result.hitMiss === 'Hit') directHit++; 
    else directMiss++;
  
  }

  // Fully Associative Cache
  output += '\nFully Associative Cache\n' +
            '__________________________________________________________________________________________________________________\n' +
            '\n' +
            ' Word Addr.              Bin Addr.                         Tag           Index    Offset   Hit/Miss    Valid Bit\n' +
            '__________________________________________________________________________________________________________________\n' +
            '\n';
  const fullyCache = new FullyAssociativeCache(cacheSize, blockSize);
  for (const addr of wordAddrs) {
    const result = fullyCache.accessAddress(addr);
    output += `${result.address.toString().padEnd(12)} ${result.binAddr.padEnd(13)} ${result.tag.padEnd(8)} ${result.index.padEnd(8)} ${result.offset.padEnd(8)} ${result.hitMiss.padEnd(11)} ${result.validBit}\n`;
  
    if (result.hitMiss === 'Hit') fullyHit++; 
    else fullyMiss++;
  
  }

  // Set-Associative Cache
  output += '\nSet-Associative Cache\n' +
            '__________________________________________________________________________________________________________________\n' +
            '\n' +
            ' Word Addr.              Bin Addr.                         Tag           Index    Offset   Hit/Miss    Valid Bit\n' +
            '__________________________________________________________________________________________________________________\n' +
            '\n';
  const setAssocCache = new SetAssociativeCache(cacheSize, blockSize, ways);
  for (const addr of wordAddrs) {
    const result = setAssocCache.accessAddress(addr);
    output += `${result.address.toString().padEnd(12)} ${result.binAddr.padEnd(13)} ${result.tag.padEnd(8)} ${result.index.padEnd(8)} ${result.offset.padEnd(8)} ${result.hitMiss.padEnd(11)} ${result.validBit}\n`;
  
    if (result.hitMiss === 'Hit') setHit++; 
    else setMiss++;
  
  }

   const hitMissData = {
    direct: { hit: directHit, miss: directMiss },
    fully: { hit: fullyHit, miss: fullyMiss },
    set: { hit: setHit, miss: setMiss },
  };

  localStorage.setItem("hitMissData", JSON.stringify(hitMissData));
  return output;
}

document.getElementById('run-button').addEventListener('click', () => {
  const cacheSize = parseInt(document.getElementById('cache-size').value, 10);
  const numBlocks = parseInt(document.getElementById('num-blocks').value, 10);
  const numWords = parseInt(document.getElementById('num-words').value, 10);
  const wordAddrs = document.getElementById('word-addrs').value.split(' ').map(Number);
  const ways = Math.max(1, Math.min(numBlocks, parseInt(document.getElementById('num-ways').value, 10) || 2));

  if (isNaN(cacheSize) || isNaN(numBlocks) || isNaN(numWords) || wordAddrs.some(isNaN) || cacheSize <= 0 || numBlocks <= 0 || numWords <= 0 || ways < 1) {
    alert("Please enter valid positive numbers for all fields.");
    return;
  }

  const output = runSimulation(cacheSize, numBlocks, numWords, wordAddrs);
  localStorage.setItem("simulationResult", output);
  window.location.href = "result.html";
});