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
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-black text-intel-900 uppercase tracking-tight font-clarendon">Protocol Architect</h1>
                {!editing && (
                    <Button onClick={() => setEditing({ templateId: `tpl-${Date.now()}`, name: 'New Layout', gridColumns: 12, blocks: [] })} className="!bg-maroon-600 hover:!bg-maroon-500 !text-[10px] !font-black !px-6 !uppercase !tracking-widest">
                        <Plus size={16} /> New Protocol
                    </Button>
                )}
            </div>

            {editing ? (
                <div className="flex-1 flex gap-6 overflow-hidden">
                    <Card className="w-64 flex flex-col shrink-0 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Template Name</label>
                            <input
                                className="w-full px-3 py-2 bg-white text-intel-900 border border-gray-200 rounded focus:ring-1 focus:ring-maroon-600 outline-none text-xs font-bold"
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
                                        className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-100 rounded hover:border-maroon-300 hover:bg-maroon-50 transition-all text-[10px] font-black uppercase tracking-widest text-intel-900 text-left"
                                    >
                                        <span>{type}</span>
                                        <Plus size={12} className="text-maroon-600" />
                                    </button>
                            ))}
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
                            <Button className="w-full !bg-intel-900 !text-[10px] !font-black !uppercase !tracking-widest" onClick={handleSave}><Save size={14} /> Commit Changes</Button>
                            <Button variant="ghost" className="w-full !text-[10px] !font-black !uppercase !tracking-widest" onClick={() => setEditing(null)}>Abort</Button>
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
                                    style={{ gridColumn: `span ${block.grid?.colSpan || 12} / span ${block.grid?.colSpan || 12}` }}
                                    className="relative group bg-slate-50 border border-slate-200 rounded-md p-4 hover:border-brand-400 hover:shadow-md transition-all"
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
                                            className="w-24 accent-maroon-600"
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
                        <Card key={tpl.templateId} className="p-6 hover:border-maroon-600 hover:shadow-xl transition-all cursor-pointer group border-t-2 border-t-intel-900">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-black text-sm text-intel-900 uppercase tracking-tight">{tpl.name}</h3>
                                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">{tpl.blocks.length} Configured Components</p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button onClick={() => setEditing(tpl)} className="p-2 bg-intel-50 text-intel-900 rounded border border-intel-100 hover:bg-intel-100"><Edit3 size={16} /></button>
                                </div>
                            </div>
                            <div className="mt-6 h-24 bg-gray-50 rounded border border-gray-100 p-3 grid grid-cols-12 gap-1.5 overflow-hidden">
                                {tpl.blocks.slice(0, 8).map(b => (
                                    <div
                                        key={b.id}
                                        style={{ gridColumn: `span ${Math.max(1, Math.round((b.grid?.colSpan || 12) / 2))} / span ${Math.max(1, Math.round((b.grid?.colSpan || 12) / 2))}` }}
                                        className="bg-intel-100 rounded h-3"
                                    />
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
