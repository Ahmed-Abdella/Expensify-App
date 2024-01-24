import React, {forwardRef, useCallback, useEffect, useMemo, useRef} from 'react';
import {View} from 'react-native';
import ReactNativeModal from 'react-native-modal';
import ColorSchemeWrapper from '@components/ColorSchemeWrapper';
import usePrevious from '@hooks/usePrevious';
import useSafeAreaInsets from '@hooks/useSafeAreaInsets';
import useStyleUtils from '@hooks/useStyleUtils';
import useTheme from '@hooks/useTheme';
import useThemeStyles from '@hooks/useThemeStyles';
import useWindowDimensions from '@hooks/useWindowDimensions';
import ComposerFocusManager from '@libs/ComposerFocusManager';
import Overlay from '@libs/Navigation/AppNavigator/Navigators/Overlay';
import useNativeDriver from '@libs/useNativeDriver';
import variables from '@styles/variables';
import * as Modal from '@userActions/Modal';
import CONST from '@src/CONST';
import type BaseModalProps from './types';

function BaseModal(
    {
        isVisible,
        onClose,
        shouldSetModalVisibility = true,
        onModalHide = () => {},
        type,
        popoverAnchorPosition = {},
        innerContainerStyle = {},
        outerStyle,
        onModalShow = () => {},
        propagateSwipe,
        fullscreen = true,
        animationIn,
        animationOut,
        useNativeDriver: useNativeDriverProp,
        useNativeDriverForBackdrop,
        hideModalContentWhileAnimating = false,
        animationInTiming,
        animationOutTiming,
        statusBarTranslucent = true,
        onLayout,
        avoidKeyboard = false,
        children,
        shouldUseCustomBackdrop = false,
    }: BaseModalProps,
    ref: React.ForwardedRef<View>,
) {
    const theme = useTheme();
    const styles = useThemeStyles();
    const StyleUtils = useStyleUtils();
    const {windowWidth, windowHeight, isSmallScreenWidth} = useWindowDimensions();

    const safeAreaInsets = useSafeAreaInsets();

    const isVisibleRef = useRef(isVisible);
    const wasVisible = usePrevious(isVisible);

    /**
     * Hides modal
     * @param callHideCallback - Should we call the onModalHide callback
     */
    const hideModal = useCallback(
        (callHideCallback = true) => {
            Modal.willAlertModalBecomeVisible(false);
            if (shouldSetModalVisibility) {
                Modal.setModalVisibility(false);
            }
            if (callHideCallback) {
                onModalHide();
            }
            Modal.onModalDidClose();
            if (!fullscreen) {
                ComposerFocusManager.setReadyToFocus();
            }
        },
        [shouldSetModalVisibility, onModalHide, fullscreen],
    );

    useEffect(() => {
        isVisibleRef.current = isVisible;
        let removeOnCloseListener: () => void;
        if (isVisible) {
            Modal.willAlertModalBecomeVisible(true);
            // To handle closing any modal already visible when this modal is mounted, i.e. PopoverReportActionContextMenu
            removeOnCloseListener = Modal.setCloseModal(onClose);
        }

        return () => {
            if (!removeOnCloseListener) {
                return;
            }
            removeOnCloseListener();
        };
    }, [isVisible, wasVisible, onClose]);

    useEffect(
        () => () => {
            // Only trigger onClose and setModalVisibility if the modal is unmounting while visible.
            if (!isVisibleRef.current) {
                return;
            }
            hideModal(true);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    const handleShowModal = () => {
        if (shouldSetModalVisibility) {
            Modal.setModalVisibility(true);
        }
        onModalShow();
    };

    const handleBackdropPress = (e?: KeyboardEvent) => {
        if (e?.key === CONST.KEYBOARD_SHORTCUTS.ENTER.shortcutKey) {
            return;
        }

        onClose();
    };

    const handleDismissModal = () => {
        ComposerFocusManager.setReadyToFocus();
    };

    const {
        modalStyle,
        modalContainerStyle,
        swipeDirection,
        animationIn: modalStyleAnimationIn,
        animationOut: modalStyleAnimationOut,
        shouldAddTopSafeAreaMargin,
        shouldAddBottomSafeAreaMargin,
        shouldAddTopSafeAreaPadding,
        shouldAddBottomSafeAreaPadding,
        hideBackdrop,
    } = useMemo(
        () =>
            StyleUtils.getModalStyles(
                type,
                {
                    windowWidth,
                    windowHeight,
                    isSmallScreenWidth,
                },
                popoverAnchorPosition,
                innerContainerStyle,
                outerStyle,
            ),
        [StyleUtils, type, windowWidth, windowHeight, isSmallScreenWidth, popoverAnchorPosition, innerContainerStyle, outerStyle],
    );

    const {
        paddingTop: safeAreaPaddingTop,
        paddingBottom: safeAreaPaddingBottom,
        paddingLeft: safeAreaPaddingLeft,
        paddingRight: safeAreaPaddingRight,
    } = StyleUtils.getSafeAreaPadding(safeAreaInsets);

    const modalPaddingStyles = StyleUtils.getModalPaddingStyles({
        safeAreaPaddingTop,
        safeAreaPaddingBottom,
        safeAreaPaddingLeft,
        safeAreaPaddingRight,
        shouldAddBottomSafeAreaMargin,
        shouldAddTopSafeAreaMargin,
        shouldAddBottomSafeAreaPadding,
        shouldAddTopSafeAreaPadding,
        modalContainerStyleMarginTop: modalContainerStyle.marginTop,
        modalContainerStyleMarginBottom: modalContainerStyle.marginBottom,
        modalContainerStylePaddingTop: modalContainerStyle.paddingTop,
        modalContainerStylePaddingBottom: modalContainerStyle.paddingBottom,
        insets: safeAreaInsets,
    });

    return (
        // this is a workaround for modal not being visible on the new arch in some cases
        // it's necessary to have a non-collapseable view as a parent of the modal to prevent
        // a conflict between RN core and Reanimated shadow tree operations
        // position absolute is needed to prevent the view from interfering with flex layout
        <View collapsable={false} style={[styles.pAbsolute]}>
            <ReactNativeModal
                onBackdropPress={handleBackdropPress}
                // Note: Escape key on web/desktop will trigger onBackButtonPress callback
                // eslint-disable-next-line react/jsx-props-no-multi-spaces
                onBackButtonPress={onClose}
                onModalShow={handleShowModal}
                propagateSwipe={propagateSwipe}
                onModalHide={hideModal}
                onModalWillShow={() => ComposerFocusManager.resetReadyToFocus()}
                onDismiss={handleDismissModal}
                onSwipeComplete={() => onClose?.()}
                swipeDirection={swipeDirection}
                isVisible={isVisible}
                backdropColor={theme.overlay}
                backdropOpacity={hideBackdrop ? 0 : variables.overlayOpacity}
                backdropTransitionOutTiming={0}
                hasBackdrop={fullscreen}
                coverScreen={fullscreen}
                style={modalStyle}
                deviceHeight={windowHeight}
                deviceWidth={windowWidth}
                animationIn={animationIn ?? modalStyleAnimationIn}
                animationOut={animationOut ?? modalStyleAnimationOut}
                useNativeDriver={useNativeDriverProp && useNativeDriver}
                useNativeDriverForBackdrop={useNativeDriverForBackdrop && useNativeDriver}
                hideModalContentWhileAnimating={hideModalContentWhileAnimating}
                animationInTiming={animationInTiming}
                animationOutTiming={animationOutTiming}
                statusBarTranslucent={statusBarTranslucent}
                onLayout={onLayout}
                avoidKeyboard={avoidKeyboard}
                customBackdrop={shouldUseCustomBackdrop ? <Overlay onPress={handleBackdropPress} /> : undefined}
            >
                <View
                    style={[styles.defaultModalContainer, modalContainerStyle, modalPaddingStyles, !isVisible && styles.pointerEventsNone]}
                    ref={ref}
                >
                    <ColorSchemeWrapper>{children}</ColorSchemeWrapper>
                </View>
            </ReactNativeModal>
        </View>
    );
}

BaseModal.displayName = 'BaseModalWithRef';

export default forwardRef(BaseModal);
