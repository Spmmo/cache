import math
from collections import OrderedDict
import tkinter as tk
from tkinter import messagebox
from tkinter import ttk

class DirectMappedCache:
    def __init__(self, cache_size, block_size):
        self.cache_size = cache_size
        self.block_size = block_size
        self.num_blocks = cache_size // block_size
        self.offset_bits = int(math.log2(block_size))
        self.index_bits = int(math.log2(self.num_blocks))
        self.tag_bits = 32 - self.index_bits - self.offset_bits
        self.cache = [{'tag': None, 'valid': False} for _ in range(self.num_blocks)]
 
    def access_address(self, address):
        offset = address & ((1 << self.offset_bits) - 1)
        index = (address >> self.offset_bits) & ((1 << self.index_bits) - 1)
        tag = address >> (self.offset_bits + self.index_bits)
       
        hit = self.cache[index]['valid'] and self.cache[index]['tag'] == tag
        if not hit:
            self.cache[index]['tag'] = tag
            self.cache[index]['valid'] = True
       
        return (address, bin(address)[2:], bin(tag)[2:], bin(index)[2:], bin(offset)[2:], 'Hit' if hit else 'Miss')
 
class FullyAssociativeCache:
    def __init__(self, cache_size, block_size):
        self.cache_size = cache_size
        self.block_size = block_size
        self.num_blocks = cache_size // block_size
        self.offset_bits = int(math.log2(block_size))
        self.tag_bits = 32 - self.offset_bits
        self.cache = OrderedDict()
 
    def access_address(self, address):
        offset = address & ((1 << self.offset_bits) - 1)
        tag = address >> self.offset_bits
       
        hit = tag in self.cache
        if hit:
            self.cache.move_to_end(tag)
        else:
            if len(self.cache) >= self.num_blocks:
                self.cache.popitem(last=False)  # Remove the least recently used item
            self.cache[tag] = True
       
        return (address, bin(address)[2:], bin(tag)[2:], '-', bin(offset)[2:], 'Hit' if hit else 'Miss')
 
class SetAssociativeCache:
    def __init__(self, cache_size, block_size, ways):
        self.cache_size = cache_size
        self.block_size = block_size
        self.ways = ways
        self.num_sets = (cache_size // block_size) // ways
        self.offset_bits = int(math.log2(block_size))
        self.index_bits = int(math.log2(self.num_sets))
        self.tag_bits = 32 - self.index_bits - self.offset_bits
        self.cache = {i: OrderedDict() for i in range(self.num_sets)}
 
    def access_address(self, address):
        offset = address & ((1 << self.offset_bits) - 1)
        index = (address >> self.offset_bits) & ((1 << self.index_bits) - 1)
        tag = address >> (self.offset_bits + self.index_bits)
       
        hit = tag in self.cache[index]
        if hit:
            self.cache[index].move_to_end(tag)
        else:
            if len(self.cache[index]) >= self.ways:
                self.cache[index].popitem(last=False)  # Remove the least recently used item
            self.cache[index][tag] = True
       
        return (address, bin(address)[2:], bin(tag)[2:], bin(index)[2:], bin(offset)[2:], 'Hit' if hit else 'Miss')
 
# ฟังก์ชันการจำลอง Cache
def run_simulation(cache_size, num_blocks, num_words_per_block, word_addrs):
    block_size = num_words_per_block * 4  # Assume each word is 4 bytes
    ways = num_blocks
   
    result = ""
   
    # Direct-Mapped Cache Simulation
    result += "\nDirect-Mapped Cache\n"
    result += "--------------------------------------------------------------------\n"
    result += "{:<12} {:<15} {:<10} {:<10} {:<10} {:<8}\n".format("Word Addr.", "Bin Addr.", "Tag", "Index", "Offset", "Hit/Miss")
    result += "--------------------------------------------------------------------\n"
    direct_cache = DirectMappedCache(cache_size, block_size)
    for address in word_addrs:
        word, bin_addr, tag, index, offset, hit_miss = direct_cache.access_address(address)
        result += "{:<12} {:<15} {:<10} {:<10} {:<10} {:<8}\n".format(word, bin_addr, tag, index, offset, hit_miss)
   
    # Fully Associative Cache Simulation
    result += "\nFully Associative Cache\n"
    result += "--------------------------------------------------------------------\n"
    result += "{:<12} {:<15} {:<10} {:<10} {:<10} {:<8}\n".format("Word Addr.", "Bin Addr.", "Tag", "Index", "Offset", "Hit/Miss")
    result += "--------------------------------------------------------------------\n"
    fully_cache = FullyAssociativeCache(cache_size, block_size)
    for address in word_addrs:
        word, bin_addr, tag, index, offset, hit_miss = fully_cache.access_address(address)
        result += "{:<12} {:<15} {:<10} {:<10} {:<10} {:<8}\n".format(word, bin_addr, tag, index, offset, hit_miss)
   
    # Set-Associative Cache Simulation
    result += "\nSet-Associative Cache\n"
    result += "--------------------------------------------------------------------\n"
    result += "{:<12} {:<15} {:<10} {:<10} {:<10} {:<8}\n".format("Word Addr.", "Bin Addr.", "Tag", "Index", "Offset", "Hit/Miss")
    result += "--------------------------------------------------------------------\n"
    set_assoc_cache = SetAssociativeCache(cache_size, block_size, ways)
    for address in word_addrs:
        word, bin_addr, tag, index, offset, hit_miss = set_assoc_cache.access_address(address)
        result += "{:<12} {:<15} {:<10} {:<10} {:<10} {:<8}\n".format(word, bin_addr, tag, index, offset, hit_miss)
   
    return result
 
# สร้าง GUI
def create_gui():
    def on_run():
        try:
            cache_size = int(entry_cache_size.get())
            num_blocks = int(entry_num_blocks.get())
            num_words_per_block = int(entry_num_words_per_block.get())
            word_addrs = list(map(int, entry_word_addrs.get().split()))
           
            result = run_simulation(cache_size, num_blocks, num_words_per_block, word_addrs)
            text_output.config(state=tk.NORMAL)  # ปลดล็อกก่อนเพิ่มผลลัพธ์ใหม่
       # แทนที่ข้อความเก่าด้วยข้อความใหม่
            text_output.replace("1.0", tk.END, result + "\n")
            text_output.config(state=tk.DISABLED)  # ล็อกไม่ให้แก้ไข
            text_output.see(tk.END)
        except ValueError:
            messagebox.showerror("Invalid input", "Please enter valid numeric values.")
 
    window = tk.Tk()
    window.title("Cache Simulator")
 
    tk.Label(window, text="Cache Size (bytes):").grid(row=0, column=0)
    entry_cache_size = tk.Entry(window)
    entry_cache_size.grid(row=0, column=1)
 
    tk.Label(window, text="Number of Blocks per Set:").grid(row=1, column=0)
    entry_num_blocks = tk.Entry(window)
    entry_num_blocks.grid(row=1, column=1)
 
    tk.Label(window, text="Number of Words per Block:").grid(row=2, column=0)
    entry_num_words_per_block = tk.Entry(window)
    entry_num_words_per_block.grid(row=2, column=1)
 
    tk.Label(window, text="Word Addresses (space-separated):").grid(row=3, column=0)
    entry_word_addrs = tk.Entry(window)
    entry_word_addrs.grid(row=3, column=1)
 
    tk.Button(window, text="Run Simulation", command=on_run).grid(row=4, column=0, columnspan=2)
 
    text_output = tk.Text(window, width=80, height=20)
    text_output.grid(row=5, column=0, columnspan=2)
 
    window.mainloop()
 
if __name__ == "__main__":
    create_gui()