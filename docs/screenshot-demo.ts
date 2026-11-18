import demo from '../apps/frontend/src/adapters/demo'
import type { MonitorAdapter } from '../apps/frontend/src/core/model'

// Use the reporting demo nodes and a single live frame for a still photograph.
export default {
  ...demo,
  async loadSite() {
    const site = await demo.loadSite()
    return {
      ...site,
      description: document.documentElement.lang === 'zh-CN' ? '演示数据' : site.description,
      settings: { ...site.settings, hiddenNodes: ['demo-8', 'demo-9', 'demo-10', 'demo-11'] },
    }
  },
  subscribe(listener, onStatus) {
    const stop = demo.subscribe(listener, onStatus)
    stop()
    return stop
  },
  loadRecent: (id, minutes) => demo.loadHistory(id, minutes / 60),
  async loadPing(id, hours) {
    const { tasks, points } = await demo.loadPing(id, hours)
    const names = document.documentElement.lang === 'zh-CN' ? ['边缘探针', '核心探针'] : ['Edge probe', 'Core probe']
    return { tasks: tasks.map((task, i) => ({ ...task, name: names[i] })), points }
  },
} satisfies MonitorAdapter
