import React, {FC, useCallback, ReactElement} from 'react';
import {Tooltip} from 'antd';
import CopyToClipboard from 'react-copy-to-clipboard';
import {useTransitionState} from '@huse/transition-state';

interface Props {
    text: string;
    children: ReactElement;
}

export const CopyButton: FC<Props> = ({text, children}) => {
    const [noticing, setNoticing] = useTransitionState(false, 1000);
    const copy = useCallback(() => setNoticing(true), [setNoticing]);

    return (
        <Tooltip open={noticing} title="Copied">
            <CopyToClipboard text={text} onCopy={copy}>
                {children}
            </CopyToClipboard>
        </Tooltip>
    );
};

// export default CopyButton;