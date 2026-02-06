import styled from 'styled-components';

export const MyOrders = ({ isVisible }: { isVisible: boolean }) => {
  return (
    <Tab isVisible={isVisible}>
      <Placeholder>My Orders coming soon...</Placeholder>
    </Tab>
  );
};

const Tab = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;` : `display: none;`)}
  flex-direction: column;
  flex: 1;
  overflow: auto;
  width: 100%;
  min-height: 10vw;
`;

const Placeholder = styled.div`
  padding: 1vw;
  text-align: center;
  color: #666;
  font-size: 0.9vw;
`;
