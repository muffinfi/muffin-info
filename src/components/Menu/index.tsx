import React, { useRef } from 'react'
import { BookOpen, Code, Info } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { css } from 'styled-components/macro'
import { networkPrefix } from 'utils/networkPrefix'
import { ReactComponent as MenuIcon } from '../../assets/images/menu.svg'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { ApplicationModal } from '../../state/application/actions'
import { useActiveNetworkVersion, useModalOpen, useToggleModal } from '../../state/application/hooks'

import { ExternalLink } from '../../theme'

const StyledMenuIcon = styled(MenuIcon)`
  path {
    stroke: ${({ theme }) => theme.text1};
  }
`

const StyledMenuButton = styled.button`
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 35px;
  background-color: ${({ theme }) => theme.bg3};

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
`

const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

const MenuFlyout = styled.span`
  min-width: 9.5rem;
  background-color: ${({ theme }) => theme.bg3};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 2.6rem;
  right: 0rem;
  z-index: 100;
`

const menuItemMixin = css`
  flex: 1;
  padding: 0.5rem 0.5rem;

  color: ${({ theme }) => theme.text2};
  font-weight: 500;
  text-decoration: none;

  :hover {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
    text-decoration: none;
    opacity: 0.6;
  }

  > svg {
    margin-right: 8px;
  }
`

const MenuItem = styled(ExternalLink)`
  ${menuItemMixin}
`

const MenuItemInternal = styled(Link)`
  ${menuItemMixin}
`

const Seperator = styled.div`
  margin: 0.75rem 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.text1};
  opacity: 0.3;
`

const MenuNavSection = styled.div`
  display: none;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: flex;
    flex-direction: column;
  `};
`

const CODE_LINK = 'https://github.com/muffinfi/muffin'

export default function Menu() {
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.MENU)
  const toggle = useToggleModal(ApplicationModal.MENU)
  useOnClickOutside(node, open ? toggle : undefined)

  const [activeNewtork] = useActiveNetworkVersion()

  return (
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451
    <StyledMenu ref={node as any}>
      <StyledMenuButton onClick={toggle}>
        <StyledMenuIcon />
      </StyledMenuButton>

      {open && (
        <MenuFlyout>
          <MenuNavSection>
            <MenuItemInternal to={networkPrefix(activeNewtork)}>Overview</MenuItemInternal>
            <MenuItemInternal to={networkPrefix(activeNewtork) + 'pools'}>Pools</MenuItemInternal>
            <MenuItemInternal to={networkPrefix(activeNewtork) + 'tiers'}>Tiers</MenuItemInternal>
            <MenuItemInternal to={networkPrefix(activeNewtork) + 'tokens'}>Tokens</MenuItemInternal>
            <MenuItem href="https://muffin.fi/">
              App<sup>↗</sup>
            </MenuItem>

            <Seperator />
          </MenuNavSection>

          <MenuItem id="link" href="https://muffin.fi/">
            <Info size={14} />
            About
          </MenuItem>
          <MenuItem id="link" href="https://docs.muffin.fi/">
            <BookOpen size={14} />
            Docs
          </MenuItem>
          <MenuItem id="link" href={CODE_LINK}>
            <Code size={14} />
            Github
          </MenuItem>
          {/* <MenuItem id="link" href="https://discord.gg/">
            <MessageCircle size={14} />
            Discord
          </MenuItem> */}
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}
