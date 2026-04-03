import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, useDraggable, useDroppable } from '@dnd-kit/core';
import { Check, X, RotateCcw, Box, CloudSun, Briefcase, Type, Image as ImageIcon } from 'lucide-react';

type Word = {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  color: string;
  visual: React.ReactNode;
};

type Category = {
  id: string;
  title: string;
  icon: React.ElementType;
  words: Word[];
};

const SpatialIcon = ({ type }: { type: string }) => (
  <svg viewBox="0 0 100 100" className="w-12 h-12 sm:w-16 sm:h-16 drop-shadow-sm">
    {type === 'behind' && <circle cx="65" cy="35" r="15" fill="#ef4444" />}
    <rect x="25" y="40" width="50" height="40" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
    {type === 'in' && (
      <>
        <circle cx="50" cy="55" r="15" fill="#ef4444" />
        <path d="M 25 60 L 75 60 L 75 80 L 25 80 Z" fill="#94a3b8" opacity="0.9"/>
      </>
    )}
    {type === 'on' && <circle cx="50" cy="25" r="15" fill="#ef4444" />}
    {type === 'under' && <circle cx="50" cy="95" r="15" fill="#ef4444" />}
    {type === 'front' && <circle cx="50" cy="65" r="18" fill="#ef4444" />}
    {type === 'beside' && <circle cx="10" cy="60" r="15" fill="#ef4444" />}
  </svg>
);

const CATEGORIES: Record<string, Category> = {
  spatial: {
    id: 'spatial',
    title: 'Spatial Relations',
    icon: Box,
    words: [
      { id: 'in', chinese: '里面', pinyin: 'lǐ miàn', english: 'in / inside', color: 'bg-sky-400', visual: <SpatialIcon type="in" /> },
      { id: 'on', chinese: '上面', pinyin: 'shàng miàn', english: 'on / above', color: 'bg-red-500', visual: <SpatialIcon type="on" /> },
      { id: 'behind', chinese: '后面', pinyin: 'hòu miàn', english: 'behind', color: 'bg-orange-500', visual: <SpatialIcon type="behind" /> },
      { id: 'front', chinese: '前面', pinyin: 'qián miàn', english: 'in front of', color: 'bg-emerald-500', visual: <SpatialIcon type="front" /> },
      { id: 'under', chinese: '下面', pinyin: 'xià miàn', english: 'under / below', color: 'bg-blue-600', visual: <SpatialIcon type="under" /> },
      { id: 'beside', chinese: '旁边', pinyin: 'páng biān', english: 'next to / beside', color: 'bg-purple-500', visual: <SpatialIcon type="beside" /> },
    ]
  },
  weather: {
    id: 'weather',
    title: 'Weather',
    icon: CloudSun,
    words: [
      { id: 'sunny', chinese: '晴天', pinyin: 'qíng tiān', english: 'sunny', color: 'bg-amber-400', visual: <span className="text-4xl sm:text-5xl">☀️</span> },
      { id: 'rainy', chinese: '下雨', pinyin: 'xià yǔ', english: 'rainy', color: 'bg-blue-400', visual: <span className="text-4xl sm:text-5xl">🌧️</span> },
      { id: 'cloudy', chinese: '多云', pinyin: 'duō yún', english: 'cloudy', color: 'bg-slate-400', visual: <span className="text-4xl sm:text-5xl">☁️</span> },
      { id: 'snowy', chinese: '下雪', pinyin: 'xià xuě', english: 'snowy', color: 'bg-sky-300', visual: <span className="text-4xl sm:text-5xl">❄️</span> },
      { id: 'windy', chinese: '刮风', pinyin: 'guā fēng', english: 'windy', color: 'bg-teal-400', visual: <span className="text-4xl sm:text-5xl">💨</span> },
      { id: 'stormy', chinese: '打雷', pinyin: 'dǎ léi', english: 'stormy', color: 'bg-indigo-500', visual: <span className="text-4xl sm:text-5xl">⛈️</span> },
    ]
  },
  jobs: {
    id: 'jobs',
    title: 'Common Jobs',
    icon: Briefcase,
    words: [
      { id: 'teacher', chinese: '老师', pinyin: 'lǎo shī', english: 'teacher', color: 'bg-emerald-500', visual: <span className="text-4xl sm:text-5xl">👨‍🏫</span> },
      { id: 'doctor', chinese: '医生', pinyin: 'yī shēng', english: 'doctor', color: 'bg-blue-500', visual: <span className="text-4xl sm:text-5xl">👨‍⚕️</span> },
      { id: 'police', chinese: '警察', pinyin: 'jǐng chá', english: 'police', color: 'bg-indigo-600', visual: <span className="text-4xl sm:text-5xl">👮</span> },
      { id: 'chef', chinese: '厨师', pinyin: 'chú shī', english: 'chef', color: 'bg-orange-500', visual: <span className="text-4xl sm:text-5xl">👨‍🍳</span> },
      { id: 'driver', chinese: '司机', pinyin: 'sī jī', english: 'driver', color: 'bg-yellow-500', visual: <span className="text-4xl sm:text-5xl">🚌</span> },
      { id: 'worker', chinese: '工人', pinyin: 'gōng rén', english: 'worker', color: 'bg-stone-500', visual: <span className="text-4xl sm:text-5xl">👷</span> },
    ]
  }
};

const playSound = (type: 'correct' | 'wrong') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'correct') {
      const playNote = (freq: number, startTime: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
        osc.start(startTime);
        osc.stop(startTime + 0.2);
      };
      
      playNote(523.25, ctx.currentTime);
      playNote(659.25, ctx.currentTime + 0.1);
      playNote(783.99, ctx.currentTime + 0.2);
      
    } else {
      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      
      playNote(329.63, ctx.currentTime, 0.15);
      playNote(261.63, ctx.currentTime + 0.15, 0.3);
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

const WordCard = ({ word, isOverlay = false }: { word: Word, isOverlay?: boolean }) => (
  <div 
    className={`w-24 h-16 sm:w-28 sm:h-20 rounded-lg shadow-sm flex flex-col items-center justify-center text-white cursor-grab active:cursor-grabbing select-none transition-shadow ${word.color} ${isOverlay ? 'shadow-xl scale-105 rotate-2' : 'hover:shadow-md'}`}
  >
    <span className="text-xl sm:text-2xl font-bold mb-1 tracking-wider">{word.chinese}</span>
    <span className="text-xs sm:text-sm font-medium opacity-90">{word.pinyin}</span>
  </div>
);

const DraggableItem = ({ id, word }: { id: string, word: Word }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={isDragging ? 'opacity-0' : ''}>
      <WordCard word={word} />
    </div>
  );
};

const DroppableBank = ({ id, availableWords, currentWords }: { id: string, availableWords: string[], currentWords: Word[] }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef} 
      className={`flex flex-wrap content-start gap-3 p-4 min-h-[200px] sm:min-h-[280px] border-2 rounded-xl transition-colors ${
        isOver ? 'border-blue-400 bg-blue-50/50' : 'border-dashed border-slate-300 bg-white/50'
      }`}
    >
      {availableWords.map(wordId => (
        <DraggableItem key={wordId} id={wordId} word={currentWords.find(w => w.id === wordId)!} />
      ))}
      {availableWords.length === 0 && (
        <div className="w-full h-full flex items-center justify-center text-slate-400 italic text-sm">
          All words placed!
        </div>
      )}
    </div>
  );
};

const DroppableSlot = ({ id, expectedWord, currentWordId, currentWords, mode }: any) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const word = currentWordId ? currentWords.find((w: Word) => w.id === currentWordId) : null;
  const hasWord = currentWordId !== null;
  const isCorrect = currentWordId === expectedWord.id;

  let borderClass = 'border-slate-200 bg-white';
  if (isOver) {
    borderClass = 'border-blue-400 bg-blue-50';
  } else if (hasWord) {
    borderClass = isCorrect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50';
  }

  return (
    <div className="flex items-center gap-3 sm:gap-4 p-2 rounded-xl hover:bg-slate-100/50 transition-colors">
      <div 
        ref={setNodeRef} 
        className={`w-24 h-16 sm:w-28 sm:h-20 border-2 rounded-lg flex items-center justify-center transition-all ${borderClass}`}
      >
        {word ? <DraggableItem id={word.id} word={word} /> : null}
      </div>
      <div className="flex-1 flex items-center justify-between">
        {mode === 'words' ? (
          <span className="text-base sm:text-lg text-slate-700 font-medium">{expectedWord.english}</span>
        ) : (
          <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16">
            {expectedWord.visual}
          </div>
        )}
        
        {hasWord && (
          <div className="flex-shrink-0">
            {isCorrect ? (
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
            ) : (
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [currentCategory, setCurrentCategory] = useState<string>('spatial');
  const [mode, setMode] = useState<'words' | 'pictures'>('words');
  
  const activeWords = CATEGORIES[currentCategory].words;

  const [slotItems, setSlotItems] = useState<Record<string, string | null>>(() => {
    const initialSlots: Record<string, string | null> = {};
    CATEGORIES['spatial'].words.forEach(w => initialSlots[w.id] = null);
    return initialSlots;
  });
  const [availableWords, setAvailableWords] = useState<string[]>(() => 
    CATEGORIES['spatial'].words.map(w => w.id).sort(() => Math.random() - 0.5)
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Initialize or reset game state
  const handleReset = (categoryId: string = currentCategory) => {
    const words = CATEGORIES[categoryId].words;
    const initialSlots: Record<string, string | null> = {};
    words.forEach(w => initialSlots[w.id] = null);
    setSlotItems(initialSlots);
    setAvailableWords(words.map(w => w.id).sort(() => Math.random() - 0.5));
    setTime(0);
    setIsPlaying(true);
  };

  // Check win condition
  useEffect(() => {
    if (Object.keys(slotItems).length === 0) return;
    const isAllCorrect = Object.keys(slotItems).every(key => slotItems[key] === key);
    if (isAllCorrect && isPlaying && Object.values(slotItems).every(v => v !== null)) {
      setIsPlaying(false);
    }
  }, [slotItems, isPlaying]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: any) => {
    setActiveId(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceSlot = Object.keys(slotItems).find(key => slotItems[key] === activeId);

    if (overId === 'bank') {
      if (sourceSlot) {
        setSlotItems(prev => ({ ...prev, [sourceSlot]: null }));
        setAvailableWords(prev => [...prev, activeId]);
      }
    } else if (overId.startsWith('slot-')) {
      const targetSlotId = overId.replace('slot-', '');
      const existingItemInTarget = slotItems[targetSlotId];

      // Instant feedback sound
      const isCorrect = activeId === targetSlotId;
      playSound(isCorrect ? 'correct' : 'wrong');

      setSlotItems(prev => {
        const newSlots = { ...prev };
        if (sourceSlot) {
          newSlots[sourceSlot] = existingItemInTarget;
        }
        newSlots[targetSlotId] = activeId;
        return newSlots;
      });

      if (!sourceSlot) {
        setAvailableWords(prev => {
          const newBank = prev.filter(id => id !== activeId);
          if (existingItemInTarget) {
            newBank.push(existingItemInTarget);
          }
          return newBank;
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-20">
        <div className="p-4 border-b border-slate-200 hidden md:block">
          <h1 className="text-xl font-bold text-slate-800">Learn Chinese</h1>
          <p className="text-sm text-slate-500 mt-1">Drag & Drop Practice</p>
        </div>
        <nav className="flex-1 p-2 md:p-4 flex flex-row md:flex-col gap-2 overflow-x-auto">
          {Object.values(CATEGORIES).map(category => {
            const Icon = category.icon;
            const isActive = currentCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => {
                  setCurrentCategory(category.id);
                  handleReset(category.id);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100' 
                    : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {category.title}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        
        {/* Top Header */}
        <header className="p-3 sm:p-4 bg-white shadow-sm border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
          
          {/* Mode Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => {
                setMode('words');
                handleReset(currentCategory);
              }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-sm sm:text-base font-medium transition-all ${
                mode === 'words' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Type className="w-4 h-4" />
              <span className="hidden sm:inline">Words</span>
            </button>
            <button 
              onClick={() => {
                setMode('pictures');
                handleReset(currentCategory);
              }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-sm sm:text-base font-medium transition-all ${
                mode === 'pictures' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Pictures</span>
            </button>
          </div>

          {/* Timer & Reset */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-xl sm:text-2xl font-mono font-bold text-slate-700">
              {formatTime(time)}
            </div>
            <button onClick={() => handleReset(currentCategory)} className="p-2 rounded-full hover:bg-slate-100 transition-colors" title="Reset Game">
              <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full">
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
              
              <div className="flex flex-col gap-3">
                <h2 className="text-base sm:text-lg font-semibold text-slate-700 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-sm sm:text-base">1</span>
                  Drag words from here...
                </h2>
                <DroppableBank id="bank" availableWords={availableWords} currentWords={activeWords} />
              </div>

              <div className="flex flex-col gap-3">
                <h2 className="text-base sm:text-lg font-semibold text-slate-700 flex items-center gap-2 mb-1">
                  <span className="bg-blue-100 text-blue-700 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-sm sm:text-base">2</span>
                  ...to the correct slots
                </h2>
                <div className="flex flex-col gap-1 sm:gap-2">
                  {activeWords.map(word => (
                    <DroppableSlot 
                      key={word.id} 
                      id={`slot-${word.id}`} 
                      expectedWord={word} 
                      currentWordId={slotItems[word.id]} 
                      currentWords={activeWords}
                      mode={mode}
                    />
                  ))}
                </div>
              </div>

            </div>

            <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
              {activeId ? <WordCard word={activeWords.find(w => w.id === activeId)!} isOverlay /> : null}
            </DragOverlay>
          </DndContext>
          
          {!isPlaying && (
            <div className="mt-8 p-4 bg-green-100 text-green-800 rounded-xl text-center font-bold text-lg animate-in fade-in slide-in-from-bottom-4">
              🎉 Congratulations! You completed {CATEGORIES[currentCategory].title} in {formatTime(time)}!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
