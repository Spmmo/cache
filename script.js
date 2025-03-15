class DirectMappedCache {
    constructor(cacheSize, blockSize) {
      this.cacheSize = cacheSize;
      this.blockSize = blockSize;
      this.numBlocks = cacheSize / blockSize;
      this.offsetBits = Math.log2(blockSize);
      this.indexBits = Math.log2(this.numBlocks);
      this.tagBits = 32 - this.indexBits - this.offsetBits;
      this.cache = Array.from({ length: this.numBlocks }, () => ({ tag: null, valid: false }));
    }
  
    accessAddress(address) {
      const offset = address & ((1 << this.offsetBits) - 1);
      const index = (address >> this.offsetBits) & ((1 << this.indexBits) - 1);
      const tag = address >> (this.offsetBits + this.indexBits);
  
      const hit = this.cache[index].valid && this.cache[index].tag === tag;
      const validBit = hit ? 'Y' : 'N';
      if (!hit) {
        this.cache[index].tag = tag;
        this.cache[index].valid = true;
      }
  
      return {
        address,
        binAddr: address.toString(2),
        tag: tag.toString(2),
        index: index.toString(2),
        offset: offset.toString(2),
        hitMiss: hit ? 'Hit' : 'Miss',
        validBit,
      };
    }
  }
  
  class FullyAssociativeCache {
    constructor(cacheSize, blockSize) {
      this.cacheSize = cacheSize;
      this.blockSize = blockSize;
      this.numBlocks = cacheSize / blockSize;
      this.offsetBits = Math.log2(blockSize);
      this.tagBits = 32 - this.offsetBits;
      this.cache = new Map();
    }
  
    accessAddress(address) {
      const offset = address & ((1 << this.offsetBits) - 1);
      const tag = address >> this.offsetBits;
  
      const hit = this.cache.has(tag);
      const validBit = hit ? 'Y' : 'N';
      if (hit) {
        this.cache.delete(tag); // Move to end (LRU)
      } else if (this.cache.size >= this.numBlocks) {
        this.cache.delete(this.cache.keys().next().value); // Remove least recently used
      }
      this.cache.set(tag, true);
  
      return {
        address,
        binAddr: address.toString(2),
        tag: tag.toString(2),
        index: '-',
        offset: offset.toString(2),
        hitMiss: hit ? 'Hit' : 'Miss',
        validBit,
      };
    }
  }
  
  class SetAssociativeCache {
    constructor(cacheSize, blockSize, ways) {
      this.cacheSize = cacheSize;
      this.blockSize = blockSize;
      this.ways = ways;
      this.numSets = (cacheSize / blockSize) / ways;
      this.offsetBits = Math.log2(blockSize);
      this.indexBits = Math.log2(this.numSets);
      this.tagBits = 32 - this.indexBits - this.offsetBits;
      this.cache = Array.from({ length: this.numSets }, () => new Map());
    }
  
    accessAddress(address) {
      const offset = address & ((1 << this.offsetBits) - 1);
      const index = (address >> this.offsetBits) & ((1 << this.indexBits) - 1);
      const tag = address >> (this.offsetBits + this.indexBits);
  
      const set = this.cache[index];
      const hit = set.has(tag);
      const validBit = hit ? 'Y' : 'N';
      if (hit) {
        set.delete(tag); // Move to end (LRU)
      } else if (set.size >= this.ways) {
        set.delete(set.keys().next().value); // Remove least recently used
      }
      set.set(tag, true);
  
      return {
        address,
        binAddr: address.toString(2),
        tag: tag.toString(2),
        index: index.toString(2),
        offset: offset.toString(2),
        hitMiss: hit ? 'Hit' : 'Miss',
        validBit,
      };
    }
  }
  
  function runSimulation(cacheSize, numBlocks, numWordsPerBlock, wordAddrs) {
    const blockSize = numWordsPerBlock * 4; // Assume each word is 4 bytes
    const ways = numBlocks;
  
    let output = '';
  
    // Direct-Mapped Cache
    output += 'Direct-Mapped Cache\n' +
              '______________________________________________________________________________\n' +
              '\n' +
              'Word Addr.    Bin Addr.     Tag      Index    Offset   Hit/Miss    Valid Bit\n' +
              '______________________________________________________________________________\n' +
              '\n';
    const directCache = new DirectMappedCache(cacheSize, blockSize);
    for (const addr of wordAddrs) {
      const result = directCache.accessAddress(addr);
      output += `${result.address.toString().padEnd(13)} ${result.binAddr.padEnd(13)} ${result.tag.padEnd(8)} ${result.index.padEnd(8)} ${result.offset.padEnd(8)} ${result.hitMiss.padEnd(11)} ${result.validBit}\n`;
    }
  
    // Fully Associative Cache
    output += '\nFully Associative Cache\n' +
              '______________________________________________________________________________\n' +
              '\n' +
              'Word Addr.    Bin Addr.     Tag      Index    Offset   Hit/Miss    Valid Bit\n' +
              '______________________________________________________________________________\n' +
              '\n';
    const fullyCache = new FullyAssociativeCache(cacheSize, blockSize);
    for (const addr of wordAddrs) {
      const result = fullyCache.accessAddress(addr);
      output += `${result.address.toString().padEnd(13)} ${result.binAddr.padEnd(13)} ${result.tag.padEnd(8)} ${result.index.padEnd(8)} ${result.offset.padEnd(8)} ${result.hitMiss.padEnd(11)} ${result.validBit}\n`;
    }
  
    // Set-Associative Cache
    output += '\nSet-Associative Cache\n' +
              '______________________________________________________________________________\n' +
              '\n' +
              'Word Addr.    Bin Addr.     Tag      Index    Offset   Hit/Miss    Valid Bit\n' +
              '______________________________________________________________________________\n' +
              '\n';
    const setAssocCache = new SetAssociativeCache(cacheSize, blockSize, ways);
    for (const addr of wordAddrs) {
      const result = setAssocCache.accessAddress(addr);
      output += `${result.address.toString().padEnd(13)} ${result.binAddr.padEnd(13)} ${result.tag.padEnd(8)} ${result.index.padEnd(8)} ${result.offset.padEnd(8)} ${result.hitMiss.padEnd(11)} ${result.validBit}\n`;
    }
  
    return output;
  }
  
  document.getElementById('run-button').addEventListener('click', () => {
    const cacheSize = parseInt(document.getElementById('cache-size').value);
    const numBlocks = parseInt(document.getElementById('num-blocks').value);
    const numWords = parseInt(document.getElementById('num-words').value);
    const wordAddrs = document.getElementById('word-addrs').value.split(' ').map(Number);

    const output = runSimulation(cacheSize, numBlocks, numWords, wordAddrs);

    localStorage.setItem("simulationResult", output);
    window.location.href = "result.html";
});
