import styled from 'styled-components';

import { Kami } from 'network/shapes';
import { Cooldown } from './Cooldown';
import { Health } from './Health';

export const TitleBar = ({
  kami,
  onClick,
  show,
  tick,
}: {
  kami: Kami;
  onClick: () => void;
  show?: {
    battery?: boolean;
    cooldown?: boolean;
  };
  tick: number;
}) => {
  /////////////////
  // RENDER

  const isStarter = !!kami.flags?.starter;

  return (
    <Container>
      <TitleGroup>
        <Title key='title' onClick={onClick}>
          {kami.name}
        </Title>
        {isStarter && <Badge>Starter</Badge>}
      </TitleGroup>
      {show?.battery && <Health kami={kami} tick={tick} />}
      {show?.cooldown && (
        <Corner key='corner'>
          <Cooldown kami={kami} tick={tick} />
        </Corner>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border-bottom: solid black 0.15vw;
  height: 1.8vw;

  display: flex;
  align-items: center;
  justify-content: flex-start;
  user-select: none;
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4vw;
`;

const Title = styled.div`
  font-size: 0.75vw;
  margin-left: 0.6vw;

  text-align: left;
  color: #4b126eff;
  cursor: pointer;
  &:hover {
    opacity: 0.6;
    text-decoration: underline;
  }
`;

const Corner = styled.div`
  flex-grow: 1;
  width: 2.7vw;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const Badge = styled.div`
  background: #f4c2ff;
  border: 0.1vw solid black;
  border-radius: 0.3vw;
  color: #4b126e;
  font-size: 0.55vw;
  font-weight: 600;
  padding: 0.1vw 0.4vw;
  text-transform: uppercase;
`;
