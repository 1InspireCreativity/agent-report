import { useState } from 'react';
import { Plus, Trash2, LayoutTemplate, BarChart2, Link as LinkIcon, Undo2, Redo2, Folder } from 'lucide-react';
import type { StorylineState, StorylineDataType, ChartGroup, ChartCapability, TemplateGroup } from './types';
import {
  blankStoryline,
  buildStorylinePayload,
  emptyTemplateGroup,
  emptyChartGroup,
  CAPABILITY_OPTIONS,
  AGGREGATION_OPTIONS,
  REGION_OPTIONS,
  STORYLINE_TYPE_OPTIONS,
  TAG_OPTIONS,
} from './utils';
import { submitChartConfig } from './api';
import MultiSelect from './MultiSelect';

interface Props {
  state: StorylineState;
  setState: React.Dispatch<React.SetStateAction<StorylineState>>;
  toast: (msg: string) => void;
  onSave: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export default function StorylineTab({ state, setState, toast, onSave, onUndo, onRedo, canUndo, canRedo }: Props) {
  const [fieldDrafts, setFieldDrafts] = useState<Record<number, string>>({});
  const [drillDrafts, setDrillDrafts] = useState<Record<number, string>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAggregation, setShowAggregation] = useState<Record<number, boolean>>({});
  const [showAnalysis, setShowAnalysis] = useState<Record<number, boolean>>({});
  const [showFieldList, setShowFieldList] = useState<Record<number, boolean>>({});

  // Hidden by default until the user explicitly checks the box, regardless of
  // whether the chart already has data for it.
  const isAggregationShown = (g: ChartGroup) => showAggregation[g.id] ?? false;
  const isAnalysisShown = (g: ChartGroup) => showAnalysis[g.id] ?? false;
  const isFieldListShown = (g: ChartGroup) => showFieldList[g.id] ?? false;

  const update = <K extends keyof StorylineState>(key: K, value: StorylineState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const updateTemplateGroup = (tgId: number, updater: (tg: TemplateGroup) => TemplateGroup) => {
    setState((prev) => ({
      ...prev,
      templateGroups: prev.templateGroups.map((tg) => (tg.id === tgId ? updater(tg) : tg)),
    }));
  };

  const addTemplateGroup = () => {
    setState((prev) => ({ ...prev, templateGroups: [...prev.templateGroups, emptyTemplateGroup()] }));
  };

  const delTemplateGroup = (tgId: number) => {
    setState((prev) => ({ ...prev, templateGroups: prev.templateGroups.filter((tg) => tg.id !== tgId) }));
  };

  const setTemplateId = (tgId: number, value: string) => updateTemplateGroup(tgId, (tg) => ({ ...tg, templateId: value }));
  const setBusinessScene = (tgId: number, value: string) => updateTemplateGroup(tgId, (tg) => ({ ...tg, businessScene: value }));
  const setTemplateType = (tgId: number, value: StorylineDataType) => updateTemplateGroup(tgId, (tg) => ({ ...tg, type: value }));

  const addDrillDimension = (tgId: number) => {
    const val = (drillDrafts[tgId] || '').trim();
    if (!val) return;
    updateTemplateGroup(tgId, (tg) => ({ ...tg, drillDimensions: [...tg.drillDimensions, val] }));
    setDrillDrafts((prev) => ({ ...prev, [tgId]: '' }));
  };
  const delDrillDimension = (tgId: number, idx: number) => {
    updateTemplateGroup(tgId, (tg) => ({ ...tg, drillDimensions: tg.drillDimensions.filter((_, i) => i !== idx) }));
  };

  const setTemplateTags = (tgId: number, values: string[]) => {
    updateTemplateGroup(tgId, (tg) => ({ ...tg, tags: values }));
  };

  const addChartGroup = (tgId: number) => {
    updateTemplateGroup(tgId, (tg) => ({ ...tg, chartGroups: [...tg.chartGroups, emptyChartGroup()] }));
  };
  const delChartGroup = (tgId: number, groupId: number) => {
    updateTemplateGroup(tgId, (tg) => ({ ...tg, chartGroups: tg.chartGroups.filter((g) => g.id !== groupId) }));
  };
  const updateChartGroup = (tgId: number, groupId: number, updater: (g: ChartGroup) => ChartGroup) => {
    updateTemplateGroup(tgId, (tg) => ({
      ...tg,
      chartGroups: tg.chartGroups.map((g) => (g.id === groupId ? updater(g) : g)),
    }));
  };

  const setChartId = (tgId: number, groupId: number, value: string) => {
    updateChartGroup(tgId, groupId, (g) => ({ ...g, chartId: value }));
  };

  const addFieldListItem = (tgId: number, groupId: number) => {
    const val = (fieldDrafts[groupId] || '').trim();
    if (!val) return;
    updateChartGroup(tgId, groupId, (g) => ({ ...g, fieldList: [...g.fieldList, val] }));
    setFieldDrafts((prev) => ({ ...prev, [groupId]: '' }));
  };
  const delFieldListItem = (tgId: number, groupId: number, idx: number) => {
    updateChartGroup(tgId, groupId, (g) => ({ ...g, fieldList: g.fieldList.filter((_, i) => i !== idx) }));
  };

  const addQueryLink = (tgId: number, groupId: number) => {
    updateChartGroup(tgId, groupId, (g) => ({ ...g, queryLinks: [...g.queryLinks, ''] }));
  };
  const delQueryLink = (tgId: number, groupId: number, idx: number) => {
    updateChartGroup(tgId, groupId, (g) => ({ ...g, queryLinks: g.queryLinks.filter((_, i) => i !== idx) }));
  };
  const setQueryLink = (tgId: number, groupId: number, idx: number, value: string) => {
    updateChartGroup(tgId, groupId, (g) => ({
      ...g,
      queryLinks: g.queryLinks.map((l, i) => (i === idx ? value : l)),
    }));
  };
  const setAggregationMethods = (tgId: number, groupId: number, values: string[]) => {
    updateChartGroup(tgId, groupId, (g) => ({ ...g, aggregationMethods: values }));
  };
  const setAggregationOtherText = (tgId: number, groupId: number, value: string) => {
    updateChartGroup(tgId, groupId, (g) => ({ ...g, aggregationOtherText: value }));
  };

  const setCapability = (tgId: number, groupId: number, cap: ChartCapability) => {
    updateChartGroup(tgId, groupId, (g) => ({ ...g, capabilities: [cap] }));
  };

  const clearCapabilities = (tgId: number, groupId: number) => {
    updateChartGroup(tgId, groupId, (g) => ({ ...g, capabilities: [] }));
  };

  const handleSave = () => {
    onSave();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const submit = async () => {
    if (!state.topic) {
      toast('⚠️ 请填写报告名称');
      return;
    }
    if (!state.templateGroups.length) {
      toast('⚠️ 请至少添加一个 Template ID');
      return;
    }
    setSubmitting(true);
    const result = await submitChartConfig(buildStorylinePayload(state));
    setSubmitting(false);
    if (result.ok) {
      toast('✅ 图表配置已提交给后端，Agent 任务启动中…');
    } else if (result.offline) {
      toast('✅ 配置已生成（后端未配置）');
    } else {
      toast('⚠️ 提交失败：' + result.error);
    }
  };

  const reset = () => {
    if (!confirm('确认重置所有图表配置？')) return;
    setState(blankStoryline());
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
      {/* Editor Toolbar */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            title="Undo"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            title="Redo"
          >
            <Redo2 size={18} />
          </button>
        </div>
        <div>
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-1.5 rounded-md shadow-sm font-medium transition-all text-sm w-24 flex justify-center"
          >
            {isSaved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
            {/* Folder Header */}
            <div className="bg-slate-100 border-b border-slate-200 px-5 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex-1 max-w-sm flex items-center gap-3">
                <div className="bg-indigo-200 text-indigo-800 p-1.5 rounded flex-shrink-0">
                  <Folder className="w-5 h-5" />
                </div>
                <div className="flex-1 flex items-center gap-2 relative">
                  <span className="text-sm font-medium text-slate-600 whitespace-nowrap">图表名称</span>
                  <input
                    type="text"
                    placeholder="例：本周 Revenue下滑归因分析"
                    value={state.topic}
                    onChange={(e) => update('topic', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow font-medium"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pl-4">
                <button
                  onClick={addTemplateGroup}
                  className="text-slate-700 hover:text-indigo-700 bg-white border border-slate-300 hover:border-indigo-300 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Template
                </button>
              </div>
            </div>

            {/* Folder Configuration */}
            <div className="px-5 py-4 border-b border-slate-200 bg-white grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">数据范围 (Data Range)</label>
                <MultiSelect
                  options={REGION_OPTIONS}
                  selected={state.regions}
                  onChange={(v) => update('regions', v)}
                  placeholder="Select data ranges..."
                  className="z-20"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">背景描述 (Background Description)</label>
                <textarea
                  value={state.background}
                  onChange={(e) => update('background', e.target.value)}
                  placeholder="示例：folder内图表在什么背景下分析什么业务问题，为agent提供知识"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[60px]"
                />
              </div>
            </div>

            {/* Templates Area */}
            <div className="p-5 space-y-5">
              {state.templateGroups.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                  <p className="text-sm text-slate-500">No templates yet.</p>
                </div>
              ) : (
                state.templateGroups.map((tg) => (
                  <div key={tg.id} className="border border-slate-200 rounded-lg overflow-visible relative bg-white">
                    {/* Template Header */}
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between rounded-t-lg">
                      <div className="flex-1 max-w-sm flex items-center gap-3">
                        <div className="bg-purple-100 text-purple-700 p-1.5 rounded flex-shrink-0">
                          <LayoutTemplate className="w-4 h-4" />
                        </div>
                        <div className="flex-1 flex items-center gap-2 relative">
                          <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Template ID</span>
                          <input
                            type="text"
                            placeholder="motz7cum6ntsj6"
                            value={tg.templateId}
                            onChange={(e) => setTemplateId(tg.id, e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pl-4">
                        <button
                          onClick={() => addChartGroup(tg.id)}
                          className="text-slate-600 hover:text-purple-600 bg-white border border-slate-200 hover:border-purple-200 px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <Plus className="w-3 h-3" />
                          Add Chart
                        </button>
                        <button
                          onClick={() => delTemplateGroup(tg.id)}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                          title="Remove Template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Template Configuration */}
                    <div className="px-4 py-3 border-b border-slate-200 bg-white grid gap-4 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">业务场景 (Business Scene)</label>
                        <input
                          type="text"
                          placeholder="如：GBS-1Team revenue和yoy"
                          value={tg.businessScene}
                          onChange={(e) => setBusinessScene(tg.id, e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Type (类型)</label>
                        <select
                          value={tg.type}
                          onChange={(e) => setTemplateType(tg.id, e.target.value as StorylineDataType)}
                          className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          {STORYLINE_TYPE_OPTIONS.map((o) => (
                            <option value={o.value} key={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-500 mb-1">下钻Dimension (键盘Enter来添加)</label>
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {tg.drillDimensions.map((d, di) => (
                            <span
                              key={di}
                              className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs flex items-center gap-1"
                            >
                              {d}
                              <button onClick={() => delDrillDimension(tg.id, di)} className="hover:text-red-600">
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="如：NAAP Lever L1"
                            value={drillDrafts[tg.id] || ''}
                            onChange={(e) => setDrillDrafts((prev) => ({ ...prev, [tg.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addDrillDimension(tg.id);
                                e.preventDefault();
                              }
                            }}
                            className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => addDrillDimension(tg.id)}
                            className="text-slate-600 hover:text-purple-600 bg-white border border-slate-200 hover:border-purple-200 px-3 py-1 rounded-md text-xs font-medium transition-colors shadow-sm"
                          >
                            + 添加
                          </button>
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-500 mb-1">标签 (Tags)</label>
                        <MultiSelect
                          options={TAG_OPTIONS}
                          selected={tg.tags}
                          onChange={(v) => setTemplateTags(tg.id, v)}
                          placeholder="Select tags..."
                        />
                      </div>
                    </div>

                    {/* Charts Area */}
                    <div className="p-4 space-y-4 bg-slate-50/30 rounded-b-lg">
                      {tg.chartGroups.length === 0 ? (
                        <div className="text-center py-4 border border-dashed border-slate-200 rounded-lg bg-white">
                          <p className="text-xs text-slate-500">No charts in this template.</p>
                        </div>
                      ) : (
                        tg.chartGroups.map((g) => (
                          <div key={g.id} className="border border-slate-200 rounded-lg overflow-visible relative bg-white">
                            {/* Chart Header */}
                            <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-between rounded-t-lg">
                              <div className="flex-1 max-w-sm flex items-center gap-3">
                                <div className="bg-sky-100 text-sky-700 p-1 rounded flex-shrink-0">
                                  <BarChart2 className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 flex items-center gap-2">
                                  <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Chart ID</span>
                                  <input
                                    type="text"
                                    placeholder="GBSrev"
                                    value={g.chartId}
                                    onChange={(e) => setChartId(tg.id, g.id, e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-shadow"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pl-4">
                                <button
                                  onClick={() => addQueryLink(tg.id, g.id)}
                                  className="text-slate-600 hover:text-sky-600 bg-white border border-slate-200 hover:border-sky-200 px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 shadow-sm"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add AC query
                                </button>
                                <button
                                  onClick={() => delChartGroup(tg.id, g.id)}
                                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                                  title="Remove Chart"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Links Area */}
                            <div className="p-3 space-y-2 bg-white">
                              {g.queryLinks.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic pl-1">No query links added yet.</p>
                              ) : (
                                g.queryLinks.map((link, li) => (
                                  <div key={li} className="flex items-center gap-2 relative group">
                                    <div className="text-slate-400">
                                      <LinkIcon className="w-3 h-3" />
                                    </div>
                                    <input
                                      type="text"
                                      placeholder="https://... (Query Link)"
                                      value={link}
                                      onChange={(e) => setQueryLink(tg.id, g.id, li, e.target.value)}
                                      className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-shadow"
                                    />
                                    <button
                                      onClick={() => delQueryLink(tg.id, g.id, li)}
                                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                      title="Remove Link"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Chart Configuration */}
                            <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-4 rounded-b-lg">
                              <div>
                                <label className="flex items-center gap-2 cursor-pointer w-fit">
                                  <input
                                    type="checkbox"
                                    checked={isAggregationShown(g)}
                                    onChange={() => setShowAggregation((prev) => ({ ...prev, [g.id]: !isAggregationShown(g) }))}
                                    className="text-sky-600 focus:ring-sky-500 border-slate-300 rounded"
                                  />
                                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">是否拼数</span>
                                </label>
                                {isAggregationShown(g) && (
                                  <div className="mt-2">
                                    <label className="block text-[11px] font-medium text-slate-500 mb-1">拼数方式 (Data Aggregation)</label>
                                    <div className="space-y-2">
                                      <MultiSelect
                                        options={AGGREGATION_OPTIONS}
                                        selected={g.aggregationMethods}
                                        onChange={(v) => setAggregationMethods(tg.id, g.id, v)}
                                        placeholder="Select aggregation methods..."
                                      />
                                      {g.aggregationMethods.includes('其他') && (
                                        <input
                                          type="text"
                                          value={g.aggregationOtherText}
                                          onChange={(e) => setAggregationOtherText(tg.id, g.id, e.target.value)}
                                          placeholder="请填写具体其他方式…"
                                          className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent mt-2"
                                        />
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div>
                                <label className="flex items-center gap-2 cursor-pointer w-fit">
                                  <input
                                    type="checkbox"
                                    checked={isAnalysisShown(g)}
                                    onChange={() => setShowAnalysis((prev) => ({ ...prev, [g.id]: !isAnalysisShown(g) }))}
                                    className="text-sky-600 focus:ring-sky-500 border-slate-300 rounded"
                                  />
                                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">是否分析</span>
                                </label>
                                {isAnalysisShown(g) && (
                                  <div className="mt-2">
                                    <div className="flex flex-wrap gap-4">
                                      {CAPABILITY_OPTIONS.map((o) => (
                                        <label key={o.value} className="flex items-center gap-1.5 cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`capability-${tg.id}-${g.id}`}
                                            checked={g.capabilities.includes(o.value)}
                                            onChange={() => setCapability(tg.id, g.id, o.value)}
                                            className="text-sky-600 focus:ring-sky-500 border-slate-300"
                                          />
                                          <span className="text-[11px] text-slate-700">{o.label}</span>
                                        </label>
                                      ))}
                                      {g.capabilities.length > 0 && (
                                        <button
                                          onClick={() => clearCapabilities(tg.id, g.id)}
                                          className="text-[10px] text-slate-400 hover:text-slate-600 underline ml-2"
                                        >
                                          清除
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div>
                                <label className="flex items-center gap-2 cursor-pointer w-fit">
                                  <input
                                    type="checkbox"
                                    checked={isFieldListShown(g)}
                                    onChange={() => setShowFieldList((prev) => ({ ...prev, [g.id]: !isFieldListShown(g) }))}
                                    className="text-sky-600 focus:ring-sky-500 border-slate-300 rounded"
                                  />
                                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">是否字段</span>
                                </label>
                                {isFieldListShown(g) && (
                                  <div className="mt-2">
                                    <label className="block text-[11px] font-medium text-slate-500 mb-1">指标字段 (field_list)</label>
                                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                                      {g.fieldList.map((f, fi) => (
                                        <span
                                          key={fi}
                                          className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded text-xs flex items-center gap-1"
                                        >
                                          {f}
                                          <button onClick={() => delFieldListItem(tg.id, g.id, fi)} className="hover:text-red-600">
                                            ×
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        placeholder="如：Stat Date"
                                        value={fieldDrafts[g.id] || ''}
                                        onChange={(e) => setFieldDrafts((prev) => ({ ...prev, [g.id]: e.target.value }))}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            addFieldListItem(tg.id, g.id);
                                            e.preventDefault();
                                          }
                                        }}
                                        className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                      />
                                      <button
                                        onClick={() => addFieldListItem(tg.id, g.id)}
                                        className="text-slate-600 hover:text-sky-600 bg-white border border-slate-200 hover:border-sky-200 px-3 py-1 rounded text-xs font-medium transition-colors shadow-sm"
                                      >
                                        + 添加
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={reset}
              className="text-slate-600 hover:text-slate-800 bg-white border border-slate-300 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              重置
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-md shadow-sm font-medium transition-all text-sm"
            >
              {submitting ? '提交中…' : '提交图表配置给 Agent'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
