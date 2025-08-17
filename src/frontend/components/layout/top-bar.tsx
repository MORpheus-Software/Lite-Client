// libs
import React from 'react';
import Styled from 'styled-components';

// img
import logo from './../../assets/images/logo_white.png';

export default () => {
  return (
    <TopBar.Layout>
      <TopBar.Draggable />
      <TopBar.HeaderWrapper>
        <TopBar.Middle>
          <TopBar.Logo src={logo} />
          <TopBar.Header>Morpheus</TopBar.Header>
        </TopBar.Middle>
      </TopBar.HeaderWrapper>
    </TopBar.Layout>
  );
};

const TopBar = {
  Layout: Styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    width: 100%;
    height: 100%;
    margin: 0;
    background: ${(props) => props.theme.colors.core};
  `,
  Draggable: Styled.div`
    display: flex;
    position: absolute;
    top: 0;
    left: 0;
    width: 80%;
    height: 40px;
    z-index: 0;
    -webkit-app-region: drag;
  `,
  HeaderWrapper: Styled.div`
    display: flex;
    flex-direction: row;
    width: 100%;
    margin: 0 20px;
    align-items: center;
    justify-content: center;
    user-select: none;
  `,
  Middle: Styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1;
    position: relative;
    height: 100%;
  `,
  Logo: Styled.img`
    display: flex;
    height: 100px;
    width: 100px;
  `,
  Header: Styled.h2`
    font-size: ${(props) => props.theme.fonts.size.medium};
    font-family: ${(props) => props.theme.fonts.family.primary.regular};
    font-weight: normal;
    color: ${(props) => props.theme.colors.balance};
    position: absolute;
    bottom: 10px;
  `,
};
