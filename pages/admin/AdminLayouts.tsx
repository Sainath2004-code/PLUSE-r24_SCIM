import React, { useState, useEffect } from 'react';
import { Plus, Save, Edit3, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { LayoutTemplate, LayoutBlock } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../context/ToastContext';

export const AdminLayouts: React.FC = () => {
    const { addToast } = useToast();
    const [templates, setTemplates] = useState<LayoutTemplate[]>([]);
    const [editing, setEditing] = useState<LayoutTemplate | null>(null);

    useEffect(() => {
        const load = async () => {
            const t = await storageService.getLayouts();
            setTemplates(t);
        };
        load();
    }, []);

    const handleSave = async () => {
        if (!editing) return;
        await storageService.saveLayout(editing);
        const t = await storageService.getLayouts();
        setTemplates(t);
        setEditing(null);
        addToast('Layout saved successfully', 'success');
    };

    const addBlock = (type: LayoutBlock['type']) => {
        if (!editing) return;
        const newBlock: LayoutBlock = {
            id: `blk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type,
            label: `New ${type}`,
            required: false,
            grid: { colStart: 1, colSpan: 12 },
            visible: true
        };
        setEditing({ ...editing, blocks: [...editing.blocks, newBlock] });
    };

    const updateBlock = (id: string, updates: Partial<LayoutBlock>) => {
        if (!editing) return;
        setEditing({
            ...editing,
            blocks: editing.blocks.map(b => b.id === id ? { ...b, ...updates } : b)
        });
    };

    const removeBlock = (id: string) => {
        if (!editing) return;
        setEditing({ ...editing, blocks: editing.blocks.filter(b => b.id !== id) });
    };

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        if (!editing) return;
        const blocks = [...editing.blocks];
        if (direction === 'up' && index > 0) {
            [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]];
        } else if (direction === 'down' && index < blocks.length - 1) {
            [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
        }
        setEditing({ ...editing, blocks });
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Layout Builder</h1>
                {!editing && (
                    <Button onClick={() => setEditing({ templateId: `tpl-${Date.now()}`, name: 'New Layout', gridColumns: 12, blocks: [] })}>
                        <Plus size={18} /> Create Template
                    </Button>
                )}
            </div>

            {editing ? (
                <div className="flex-1 flex gap-6 overflow-hidden">
                    <Card className="w-64 flex flex-col shrink-0 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Template Name</label>
                            <input
                                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded focus:ring-2 focus:ring-brand-500 outline-none"
                                value={editing.name}
                                onChange={e => setEditing({ ...editing, name: e.target.value })}
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Add Blocks</p>
                            {['title', 'excerpt', 'markdown', 'image', 'tags', 'publishDate', 'author', 'divider'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => addBlock(type as any)}
                                    className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded hover:bg-slate-50 hover:border-brand-300 transition-all text-sm font-medium text-slate-700 text-left capitalize"
                                >
                                    <Plus size={14} className="text-brand-500" /> {type}
                                </button>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2">
                            <Button className="flex-1" onClick={handleSave}><Save size={16} /> Save</Button>
                            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                        </div>
                    </Card>

                    <div className="flex-1 overflow-y-auto bg-slate-200/50 p-8 rounded-xl border-2 border-dashed border-slate-300">
                        <div className="max-w-4xl mx-auto bg-white min-h-[500px] shadow-lg rounded-lg p-8 grid grid-cols-12 gap-4 auto-rows-min">
                            {editing.blocks.length === 0 && (
                                <div className="col-span-12 py-20 text-center text-slate-400">
                                    Add blocks from the left panel to build your layout.
                                </div>
                            )}
                            {editing.blocks.map((block, idx) => (
                                <div
                                    key={block.id}
                                    className={`relative group bg-slate-50 border border-slate-200 rounded-md p-4 col-span-${block.grid?.colSpan || 12} hover:border-brand-400 hover:shadow-md transition-all`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold uppercase bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{block.type}</span>
                                            <input
                                                value={block.label}
                                                onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                                                className="text-sm font-medium bg-transparent text-slate-900 border-b border-transparent focus:border-brand-500 outline-none w-32"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => moveBlock(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"><ChevronUp size={14} /></button>
                                            <button onClick={() => moveBlock(idx, 'down')} disabled={idx === editing.blocks.length - 1} className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"><ChevronDown size={14} /></button>
                                            <button onClick={() => removeBlock(block.id)} className="p-1 hover:bg-red-100 text-red-500 rounded ml-2"><Trash2 size={14} /></button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
                                        <span>Width: {block.grid?.colSpan}/12</span>
                                        <input
                                            type="range" min="1" max="12"
                                            value={block.grid?.colSpan || 12}
                                            onChange={(e) => updateBlock(block.id, { grid: { ...block.grid!, colSpan: parseInt(e.target.value) } })}
                                            className="w-24 accent-brand-600"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(tpl => (
                        <Card key={tpl.templateId} className="p-6 hover:border-brand-300 transition-colors cursor-pointer group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">{tpl.name}</h3>
                                    <p className="text-slate-500 text-sm mt-1">{tpl.blocks.length} blocks configured</p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button onClick={() => setEditing(tpl)} className="p-2 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100"><Edit3 size={18} /></button>
                                </div>
                            </div>
                            <div className="mt-4 h-24 bg-slate-50 rounded border border-slate-100 p-2 grid grid-cols-12 gap-1 overflow-hidden">
                                {tpl.blocks.slice(0, 8).map(b => (
                                    <div key={b.id} className={`bg-slate-200 rounded-sm h-4 col-span-${Math.max(1, Math.round((b.grid?.colSpan || 12) / 2))}`} />
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
