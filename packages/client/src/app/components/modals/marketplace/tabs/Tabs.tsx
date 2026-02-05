import styled from 'styled-components';

import { playClick } from 'utils/sounds';

export const Tabs = ({ tab, setTab }: { tab: string; setTab: (tab: string) => void }) => {
  const handleTabClick = (newTab: string) => {
    playClick();
    setTab(newTab);
  };

  return (
    <Container>
      <Button onClick={() => handleTabClick('listings')} disabled={tab === 'listings'}>
        Listings
      </Button>
      <Button onClick={() => handleTabClick('bids')} disabled={tab === 'bids'}>
        Bids
      </Button>
      <Button
        onClick={() => handleTabClick('myOrders')}
        disabled={tab === 'myOrders'}
        style={{ borderRight: 'none' }}
      >
        My Orders
      </Button>
    </Container>
  );
};

const Container = styled.div`
  border: solid 0.15vw black;
  border-radius: 0.3vw 0.3vw 0 0;

  margin-bottom: 0.6vw;
  width: 100%;
  background-color: white;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`;

const Button = styled.button`
  border: none;
  padding: 0.5vw;

  flex-grow: 1;
  color: black;
  justify-content: center;
  border-right: solid black 0.15vw;

  font-size: 0.9vw;
  text-align: center;

  cursor: pointer;
  pointer-events: auto;
  &:active {
    background-color: #111;
  }
  &:hover {
    background-color: #ddd;
  }
  &:disabled {
    background-color: #b2b2b2;
    cursor: default;
    pointer-events: none;
  }
`;
