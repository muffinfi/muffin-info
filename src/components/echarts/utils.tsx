export { default as ReactEChartsCore } from 'echarts-for-react/lib/core'
import { BarChart, LineChart } from 'echarts/charts'
import {
  // VisualMapComponent,
  // VisualMapContinuousComponent,
  // VisualMapPiecewiseComponent,
  // AriaComponent,
  // TransformComponent,
  DatasetComponent,
  // MarkAreaComponent,
  // LegendComponent,
  // LegendScrollComponent,
  // LegendPlainComponent,
  DataZoomComponent,
  // DataZoomInsideComponent,
  // DataZoomSliderComponent,
  // GridSimpleComponent,
  GridComponent,
  // TimelineComponent,
  // MarkPointComponent,
  MarkLineComponent,
  // AxisPointerComponent,
  // BrushComponent,
  TitleComponent,
  // PolarComponent,
  // RadarComponent,
  // GeoComponent,
  // SingleAxisComponent,
  // ParallelComponent,
  // CalendarComponent,
  // GraphicComponent,
  ToolboxComponent,
  TooltipComponent,
} from 'echarts/components'
import * as echartsCore from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

echartsCore.use([
  DatasetComponent,
  DataZoomComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  GridComponent,
  BarChart,
  LineChart,
  CanvasRenderer,
  MarkLineComponent,
])

export const echarts = echartsCore
