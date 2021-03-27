import React from 'react'
import ReactECharts from 'echarts-for-react'
import { Card } from '../../layout/card/card'
import { Tabs } from '../../layout/tabs/tabs'
import { Constants } from '../../../config/globals'
import { formatDate } from '../../../utils/date'
import { parseDailyStats } from '../../../utils/parse'

const VIEW_TABS = [
  {
    label: 'Creștere zilnică',
    value: 'daily',
  },
  { label: 'Creștere cumulativă', value: 'cumulative' },
]
export const EMBED_PATH_CASES_PER_DAY = 'cazuri-pe-zi'
export class CasesPerDayCard extends React.PureComponent {
  state = {
    activeTab: VIEW_TABS[0].value,
  }

  getZoomStartPercentage = (dates) => {
    const datesCount = dates?.length
    const daysToShow = 14
    return datesCount ? ((datesCount - daysToShow) * 100) / datesCount : 0
  }

  getChartOptions(records) {
    const dates = records.dates
    const listConfirmed = records.confirmedCasesHistory
    const listCured = records.curedCasesHistory
    const listDeaths = records.deathCasesHistory
    const labels = ['Confirmați', 'Vindecați', 'Decedaţi']
    const chartType =
      this.state.activeTab === VIEW_TABS[0].value ? 'bar' : 'line'
    const tooltipItemColorStyle =
      'border-radius: 50%; margin-right: 6px; width: 10px; height: 10px;'
    const tooltipItemStyle =
      'height: 20px; display: flex; flex-wrap: nowrap; align-items: center;'
    const chartStack = chartType === 'bar' ? 'one' : false
    const zoomStart = this.getZoomStartPercentage(dates)

    return {
      aria: {
        show: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          color: 'gray',
          fontWeight: 'bold',
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: 'gray',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          axis: 'x',
        },
        formatter: function (params) {
          const date = `${params[0].axisValueLabel}`
          const cases = params.map(
            (param) => `
          <span style="${tooltipItemStyle}">
            <span
            style="${tooltipItemColorStyle} background-color: ${param.color};"
            ></span>
            <p style={"text-align: right;"}>${param.seriesName}: ${param.value}</p>
          </span>`
          )

          return `
            ${date}
            ${cases.reverse().join('')}
          `
        },
      },
      legend: {
        data: labels,
        bottom: 0,
        icon: 'circle',
      },
      grid: {
        left: '1%',
        right: '1%',
        bottom: 80,
        top: 20,
        containLabel: true,
      },
      dataZoom: [
        {
          type: 'slider',
          start: zoomStart,
          end: 100,
          bottom: 50,
        },
      ],
      series: [
        {
          data: listConfirmed,
          name: labels[0],
          stack: chartStack,
          type: chartType,
          color: Constants.confirmedColor,
        },
        {
          data: listCured,
          name: labels[1],
          stack: chartStack,
          type: chartType,
          color: Constants.curedColor,
        },
        {
          data: listDeaths,
          name: labels[2],
          stack: chartStack,
          type: chartType,
          color: Constants.deathColor,
        },
      ],
    }
  }

  handleClickTab = (tab) => {
    this.setState({ activeTab: tab.value })
  }

  render() {
    const { activeTab } = this.state
    const daily = parseDailyStats(this.props.state, { cumulative: false })
    const cumulative = parseDailyStats(this.props.state, { cumulative: true })
    const records = activeTab === VIEW_TABS[0].value ? daily : cumulative
    const { error, isStale, lastUpdatedOn } = records
    return (
      <Card
        title="Număr de cazuri pe zile"
        subtitle={`Ultima actualizare: ${formatDate(lastUpdatedOn)}`}
        isStale={isStale}
        error={error}
        embedPath={EMBED_PATH_CASES_PER_DAY}
      >
        <ReactECharts
          lazyUpdate
          opts={{ renderer: 'svg' }}
          style={{
            height: '470px',
            marginBottom: '1rem',
          }}
          option={this.getChartOptions(records)}
        />
        <Tabs
          tabList={VIEW_TABS}
          activeTab={activeTab}
          onSelect={this.handleClickTab}
        />
        {/* <AccessibillityCasesPerDayTable
          dates={records.dates}
          listConfirmed={records.confirmedCasesHistory}
          listCured={records.curedCasesHistory}
          listDeaths={records.deathCasesHistory}
        /> */}
      </Card>
    )
  }
}

/*
A table containg the data from cases-per-day-card that is hidden and can be only
accessed by screen readers
*/
// eslint-disable-next-line no-unused-vars
const AccessibillityCasesPerDayTable = (props) => {
  const records = []
  for (let i = props.dates.length - 1; i >= 0; i--) {
    if (props.dates[i] === ' ') {
      break
    }
    records.push({
      date: props.dates[i],
      confirmed: props.listConfirmed[i],
      cured: props.listCured[i],
      deaths: props.listDeaths[i],
    })
  }
  return (
    <table role="table" className="sr-only">
      <thead>
        <tr role="row">
          <th role="columnheader">Dată</th>
          <th role="columnheader">Confirmaţi</th>
          <th role="columnheader">Vindecaţi</th>
          <th role="columnheader">Decedaţi</th>
        </tr>
      </thead>
      <tbody>
        {records.map((record, index) => (
          <tr role="row" key={index}>
            <td role="cell">{record.date}</td>
            <td role="cell">{record.confirmed}</td>
            <td role="cell">{record.cured}</td>
            <td role="cell">{record.deaths}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
