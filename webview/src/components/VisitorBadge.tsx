import * as React from 'react';

export interface IVisitorBadgeProps {
  viewType: string;
}

export const VisitorBadge: React.FunctionComponent<IVisitorBadgeProps> = ({ viewType }: React.PropsWithChildren<IVisitorBadgeProps>) => {
  return (
    <img style={{
      display: 'none'
    }} src={`https://api.visitorbadge.io/api/combined?path=https:%2f%2fgithub.com%2festruyf%2fvscode-ghostwriter&labelColor=%23202736&countColor=%23FFD23F&slug=${viewType}`} alt={`Ghostwriter usage`} />
  );
};