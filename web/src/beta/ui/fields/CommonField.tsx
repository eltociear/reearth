
import { Typography } from "@reearth/beta/lib/reearth-ui";
import { styled, useTheme } from "@reearth/services/theme";
import { FC, ReactNode } from "react";

export interface CommonFieldProps {
  commonTitle?: string;
  description?: string;
}

const CommonField: FC<CommonFieldProps & { children?: ReactNode }> = ({
  commonTitle,
  description,
  children
}) => {
  const theme = useTheme();
  return (
    <Wrapper>
      {commonTitle && <Typography size="body">{commonTitle}</Typography>}
      {children}
      {description && (
        <Typography size="footnote" color={theme.content.weak}>
          {description}
        </Typography>
      )}
    </Wrapper>
  );
};

export default CommonField;

const Wrapper = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing.small,
  ["* ::-webkit-scrollbar"]: {
    width: "8px"
  },
  ["* ::-webkit-scrollbar-track"]: {
    background: theme.relative.darker,
    borderRadius: "10px"
  },
  ["* ::-webkit-scrollbar-thumb"]: {
    background: theme.relative.light,
    borderRadius: "4px"
  },
  ["* ::-webkit-scrollbar-thumb:hover"]: {
    background: theme.relative.lighter
  }
}));
