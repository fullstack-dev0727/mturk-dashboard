import { splitProps, JSX, Show, For, Component } from 'solid-js';
import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Button,
    createDisclosure,
} from "@hope-ui/solid"

export type ModalProps = {
    show: boolean;
    setModalShow: (flag: boolean) => void;
    setIsPlaying: (flag: boolean) => void;
  }

const { isOpen, onOpen } = createDisclosure()
const CustomModal: Component<ModalProps> = (props: ModalProps) => {
    const onClose = () => {
        props.setModalShow(false);
        props.setIsPlaying(false);
    }
    return (
        <>
        <Modal opened={props.show} onClose={onClose}>
            <ModalOverlay
                bg="$blackAlpha3"
                css={{
                    backdropFilter: "blur(10px) hue-rotate(90deg)",
                }}
            />
            <ModalContent>
                <ModalCloseButton />
                <ModalBody>
                    <video id='modal-video' poster="./poster.png"></video>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={onClose}>Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
        </>
    );
}


export default CustomModal;