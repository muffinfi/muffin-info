import NetworkDropdown from 'components/Menu/NetworkDropdown'
import SearchSmall from 'components/Search'
import { darken } from 'polished'
import React from 'react'
import { NavLink } from 'react-router-dom'
import { useActiveNetworkVersion } from 'state/application/hooks'
import styled, { css } from 'styled-components/macro'
import { ExternalLink } from 'theme'
import { networkPrefix } from 'utils/networkPrefix'
import LogoDark from '../../assets/svg/muffin_logo.svg'
import Menu from '../Menu'
import Row, { RowBetween } from '../Row'

const Wrapper = styled(RowBetween)`
  position: relative;
  top: 0;
  z-index: 2;

  background-color: ${({ theme }) => theme.bg0};
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);

  padding: 0.65rem 1rem;
  height: 60px;
  gap: 8px;
`

const NavLinkRow = styled(Row)`
  & > *:not(:first-child) {
    ${({ theme }) => theme.mediaWidth.upToMedium`
      display: none
    `}
  }
`

const LogoWrapper = styled(NavLink)`
  margin-right: 12px;
  margin-left: 4px;
  pointer-events: auto;
  line-height: 0;
  :hover {
    cursor: pointer;
  }
`

const navLinkMixin = css`
  ${({ theme }) => theme.flexRowNoWrap}

  width: fit-content;
  margin: 0 6px;
  padding: 8px 12px;

  cursor: pointer;
  outline: none;
  text-decoration: none;
  border-radius: 3rem;

  font-size: 1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text3};

  :active {
    color: ${({ theme }) => theme.text3};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({ activeClassName })`
  ${navLinkMixin}

  &.${activeClassName} {
    border-radius: 12px;
    background-color: ${({ theme }) => theme.bg2};
    color: ${({ theme }) => theme.text1};
  }
`

const StyledExternalLink = styled(ExternalLink)`
  ${navLinkMixin}
`

const UniIcon = styled.div`
  transition: transform 0.6s ease;
  :hover {
    transform: rotate(-720deg);
  }
`

export const StyledMenuButton = styled.button`
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 35px;
  background-color: ${({ theme }) => theme.bg3};
  margin-left: 8px;
  padding: 0.15rem 0.5rem;
  border-radius: 0.5rem;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.bg4};
  }

  svg {
    margin-top: 2px;
  }

  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`

export default function Header() {
  const [activeNewtork] = useActiveNetworkVersion()

  return (
    <Wrapper>
      <NavLinkRow width="auto" minWidth="auto">
        <LogoWrapper to={networkPrefix(activeNewtork)}>
          <UniIcon>
            <img width={'24px'} src={LogoDark} alt="logo" />
          </UniIcon>
        </LogoWrapper>
        <StyledNavLink
          id={`overview-nav-link`}
          to={networkPrefix(activeNewtork)}
          isActive={(match, { pathname }) => pathname === '/'}
        >
          Overview
        </StyledNavLink>
        <StyledNavLink
          id={`pools-nav-link`}
          to={networkPrefix(activeNewtork) + 'pools'}
          isActive={(match, { pathname }) => Boolean(match && !pathname.includes('/tiers'))}
        >
          Pools
        </StyledNavLink>
        <StyledNavLink
          id={`tiers-nav-link`}
          to={networkPrefix(activeNewtork) + 'tiers'}
          isActive={(match, { pathname }) => Boolean(match || pathname.includes('/tiers'))}
        >
          Tiers
        </StyledNavLink>
        <StyledNavLink id={`tokens-nav-link`} to={networkPrefix(activeNewtork) + 'tokens'}>
          Tokens
        </StyledNavLink>
        <StyledExternalLink href="https://muffin.fi/">
          App
          <sup>↗</sup>
        </StyledExternalLink>
      </NavLinkRow>

      <Row width="100%" minWidth="auto" justify="flex-end">
        <NetworkDropdown />
        <SearchSmall />
        <Menu />
      </Row>
    </Wrapper>
  )
}
