import {
  Box,
  Button,
  Flex,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
  Icon,
} from "@chakra-ui/react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import { FaGithub } from "react-icons/fa";
import GlobalContainer from "../GlobalContainer";

const Navbar = () => {
  const { data: userSession } = useSession();
  // useEffect(() => {
  //   console.log({userSession})
  // }, [userSession])

  return (
    <Box
      as="nav"
      position="fixed"
      h={12}
      w="full"
      boxShadow="md"
      bgColor="whiteAlpha.700"
      fontSize="14px"
      isolation="isolate"
      zIndex={1}
      backdropFilter="auto"
      backdropBlur="base"
    >
      <GlobalContainer h="full">
        <Flex justifyContent="space-between" alignItems="center" h="full">
          <Link href="/">
            <Text color="gray.900" fontWeight={"semibold"}>
              BTC Transcripts Queue
            </Text>
          </Link>
          {!userSession ? (
            <Button variant={"link"} onClick={() => signIn("github")}>
              <Flex alignItems="center" gap={2}>
                <Text>Sign In</Text>
                <Icon as={FaGithub} />
              </Flex>
            </Button>
          ) : (
            <Flex>
              {userSession.user?.image && (
                <Popover placement="bottom-end">
                  <PopoverTrigger>
                    <Flex alignItems="center" gap={2}>
                      <Text fontSize="12px" fontWeight="semibold">
                        My Account
                      </Text>
                      <Button variant="unstyled" h="auto" w="auto" minW="auto">
                        <Box
                          p={1}
                          border="2px solid"
                          borderColor="orange.300"
                          borderRadius="full"
                        >
                          <Image
                            src={userSession.user?.image}
                            width="24"
                            height="24"
                            alt="profile"
                            style={{ borderRadius: "100%" }}
                          />
                        </Box>
                      </Button>
                    </Flex>
                  </PopoverTrigger>
                  <PopoverContent w="auto" minW="200px">
                    <PopoverHeader fontWeight="semibold">
                      SignedIn as
                    </PopoverHeader>
                    <PopoverBody>
                      <Text>{userSession.user?.name}</Text>
                      <Button
                        mt={2}
                        ml="auto"
                        size="xs"
                        colorScheme="red"
                        onClick={() => signOut()}
                      >
                        Sign Out
                      </Button>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
              )}
            </Flex>
          )}
        </Flex>
      </GlobalContainer>
    </Box>
  );
};

export default Navbar;
