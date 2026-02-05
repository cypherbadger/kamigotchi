import { useState } from 'react';
import styled from 'styled-components';

import { IconButton, Text } from 'app/components/library';

type OrderType = 'Sell' | 'Buy';

export const CreateOrder = ({ isVisible }: { isVisible: boolean }) => {
  const [orderType, setOrderType] = useState<OrderType>('Sell');

  const toggleOrderType = () => {
    if (orderType === 'Sell') setOrderType('Buy');
    if (orderType === 'Buy') setOrderType('Sell');
  };

  return (
    <Container isVisible={isVisible}>
      <Title>Create order</Title>
      <Body>
        <Row>
          <Text size={1.2}>I want to:</Text>
          <IconButton text={`< ${orderType} >`} onClick={toggleOrderType} />
        </Row>
      </Body>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;` : `display: none;`)}
  flex-direction: column;
  border-top: 0.15vw solid black;
  width: 100%;
  gap: 0.6vw;
`;

const Title = styled.div`
  background-color: rgb(221, 221, 221);
  width: 100%;
  padding: 0.8vw;
  color: black;
  font-size: 1.2vw;
  text-align: left;
`;

const Body = styled.div`
  padding: 0.6vw;
  gap: 0.6vw;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const Row = styled.div`
  width: 100%;
  gap: 0.6vw;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
`;
