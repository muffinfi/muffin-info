import Row from 'components/Row'
import { transparentize } from 'polished'
import React, { memo } from 'react'
import styled from 'styled-components/macro'

const LegendRow = styled(Row)`
  gap: 24px;
  width: fit-content;
  margin: auto;
  flex-wrap: wrap;

  & > div {
    width: fit-content;
    white-space: nowrap;
    font-size: 11px;
    color: #666;
  }
`

const Legend = ({ labels, colors }: { labels: string[]; colors: string[] }) => {
  return (
    <LegendRow>
      {labels.map((label, i) => (
        <Row key={i}>
          <span style={{ color: transparentize(0.3, colors[i % colors.length]) }}>●&nbsp;</span>
          <span>{label}</span>
        </Row>
      ))}
    </LegendRow>
  )
}

export default memo(Legend)
