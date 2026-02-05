import styled from 'styled-components';

export const MyOrders = ({ isVisible }: { isVisible: boolean }) => {
  return (
    <Tab isVisible={isVisible}>
      <Placeholder>My Orders coming soon...</Placeholder>
    </Tab>
  );
};

const Tab = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex; flex-direction: column;` : `display: none;`)}
  width: 100%;
  min-height: 10vw;
`;

const Placeholder = styled.div`
  padding: 1vw;
  text-align: center;
  color: #666;
  font-size: 0.9vw;
`;
