
  const extractParameters = (modelName: string): string | null => {
    const name = modelName.toLowerCase();
    
    // Extract parameter count from model names
    if (name.includes('671b') || name.includes('600b')) return '671B';
    if (name.includes('235b') || name.includes('200b')) return '235B';
    if (name.includes('70b') || name.includes('72b')) return '70B';
    if (name.includes('30b') || name.includes('32b') || name.includes('33b')) return '30B';
    if (name.includes('13b') || name.includes('14b')) return '14B';
    if (name.includes('11b') || name.includes('12b')) return '13B';
    if (name.includes('7b') || name.includes('8b') || name.includes('6b')) return '7B';
    if (name.includes('4b')) return '4B';
    if (name.includes('3b') || name.includes('2.7b')) return '3B';
    if (name.includes('1.5b') || name.includes('1.7b')) return '1.5B';
    if (name.includes('1b') || (name.includes('1.') && name.includes('b'))) return '1B';
    if (name.includes('0.5b') || name.includes('0.6b')) return '0.5B';
    
    // Special cases for specific model families
    if (name.includes('phi-4') || name.includes('phi4')) return '14B';
    if (name.includes('phi-3') || name.includes('phi3')) return '3.8B';
    if (name.includes('phi-2') || name.includes('phi2')) return '2.7B';
    if (name.includes('orca-mini')) return '3B';
    if (name.includes('gemma') && name.includes('2b')) return '2B';
    if (name.includes('gemma')) return '7B';
    
    return null;
  };

