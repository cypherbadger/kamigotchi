import { useMemo, useState } from 'react';
import styled from 'styled-components';

import { isResting } from 'app/cache/kami';
import { IconButton } from 'app/components/library';
import { Kami } from 'network/shapes/Kami';

import { Buy } from './Buy';
import { Sell } from './Sell';

type OrderType = 'Sell' | 'Buy';

export const CreateOrder = ({
  isVisible,
  onClose,
  utils,
}: {
  isVisible: boolean;
  onClose: () => void;
  utils: {
    getAccountKamis: () => Kami[];
  };
}) => {
  const [orderType, setOrderType] = useState<OrderType>('Sell');
  const [price, setPrice] = useState('');
  const [kamiName, setKamiName] = useState('');
  const [expiration, setExpiration] = useState(1);

  const restingKamis = useMemo(() => {
    return utils.getAccountKamis().filter((kami) => isResting(kami));
  }, [utils]);

  const kamiOptions = useMemo(
    () => restingKamis.map((k) => ({ text: k.name, object: k, img: k.image })),
    [restingKamis]
  );

  const handleKamiSelect = (_selected: any[]) => {};

  const handleCreate = () => {};
  const handleClear = () => {};

  const toggleOrderType = () => {
    if (orderType === 'Sell') setOrderType('Buy');
    if (orderType === 'Buy') setOrderType('Sell');
  };

  return (
    <Container isVisible={isVisible}>
      <Header>
        <HeaderTitle>Create order</HeaderTitle>
        <IconButton text='X' onClick={onClose} />
      </Header>
      <Body>
        <Row style={{ alignItems: `center` }}>
          <Label>I want to:</Label>
          <IconButton text={`< ${orderType} >`} onClick={toggleOrderType} />
        </Row>
      </Body>
      <Sell
        isVisible={orderType === 'Sell'}
        kamiOptions={kamiOptions}
        handleKamiSelect={handleKamiSelect}
        price={price}
        setPrice={setPrice}
        expiration={expiration}
        setExpiration={setExpiration}
      />
      <Buy
        isVisible={orderType === 'Buy'}
        kamiName={kamiName}
        setKamiName={setKamiName}
        price={price}
        setPrice={setPrice}
      />
      <Actions>
        <IconButton text='Create' onClick={handleCreate} />
        <IconButton text='Clear' onClick={handleClear} />
      </Actions>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;` : `display: none;`)}
  flex-direction: column;
  flex: 0 0 45%;
  overflow: auto;
  border-top: 0.15vw solid black;
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  background-color: rgb(221, 221, 221);
  padding: 0.8vw;
  font-size: 1.2vw;
`;

const HeaderTitle = styled.span`
  flex: 1;
  text-align: center;
`;

const Body = styled.div`
  padding: 0.3vw 0 0 0.3vw;
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
`;

const Label = styled.span`
  font-size: 1vw;
`;

const Actions = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  gap: 0.6vw;
  padding: 0.6vw;
  margin-top: auto;
`;
