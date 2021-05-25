import React from "react";
import styled from "styled-components";
import { useActiveWeb3React } from "../../hooks";
import { shortenAddress } from "../../utils";
import Copy from "./Copy";
import { Jazzicon } from "@ukstv/jazzicon-react";

import { SUPPORTED_WALLETS } from "../../connectors";
import { getEtherscanLink } from "../../utils";
import { injected } from "../../connectors";
import SVG from "react-inlinesvg";
import { ExternalLink } from "../../theme";

export const ModifiedJazzicon = styled(Jazzicon)`
	width: 48px;
	height: 48px;
	border-radius: 48px;

	@media (max-width: 1199px) {
		width: 32px;
		height: 32px;
		border-radius: 32px;
	}
`;
const UpperSection = styled.div`
	position: relative;

	h5 {
		margin: 0;
		margin-bottom: 0.5rem;
		font-size: 1rem;
		font-weight: 400;
	}

	h5:last-child {
		margin-bottom: 0px;
	}

	h4 {
		margin-top: 0;
		font-weight: 500;
	}
`;

const InfoCard = styled.div`
	padding: 1rem 0;
	position: relative;
	display: grid;
	grid-row-gap: 30px;
	margin-bottom: 20px;

	@media (max-width: 1199px) {
		padding: 0;
		margin-bottom: 0;
	}
`;

const AccountGroupingRow = styled.div`
	${({ theme }) => theme.flexRowNoWrap};
	justify-content: space-between;
	align-items: center;
	font-weight: 400;
	color: ${({ theme }) => theme.text1};

	div {
		${({ theme }) => theme.flexRowNoWrap};
		align-items: center;
	}
`;

const AccountSection = styled.div`
	background-color: ${({ theme }) => theme.modalBG};

	@media (max-width: 1199px) {
		padding: 1.25rem 3.5rem 1rem;
	}
`;

const YourAccount = styled.div`
	h5 {
		margin: 0 0 1rem 0;
		font-weight: 400;
	}

	h4 {
		margin: 0;
		font-weight: 500;
	}
`;

const AccountControl = styled.div`
	display: flex;
	min-width: 0;
	width: 100%;

	font-weight: 500;
	font-size: 1.25rem;

	padding-top: 1.5rem;

	@media (max-width: 1199px) {
		padding-top: 0.75rem;
		flex-direction: column !important;
		justify-content: space-between !important;
		align-items: stretch !important;

		& > a,
		& > button {
			margin-bottom: 45px;
		}
	}

	a:hover {
		text-decoration: underline;
	}

	p {
		min-width: 0;
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
`;

const AddressLink = styled(ExternalLink)<{ hasENS: boolean; isENS: boolean }>`
	font-size: 0.825rem;
	color: ${({ theme }) => theme.text3};
	margin-left: 1.75rem;
	font-size: 0.825rem;
	display: flex;
	align-items: center;
	:hover {
		color: ${({ theme }) => theme.text3};
	}

	@media (max-width: 1199px) {
		margin-left: 0;
	}
`;

const WalletName = styled.div`
	width: initial;
	font-size: 1rem;
	font-weight: 700;
	color: ${({ theme }) => theme.text3};
`;

const WalletButtons = styled.span`
	font-size: 1rem;
	font-weight: 500;
	text-decoration: underline;
	color: ${({ theme }) => theme.text3};
`;

const WalletLink = styled.p`
	color: ${({ theme }) => theme.primary};
	background-color: ${({ theme }) => theme.primaryLight};
	border-radius: 18px;
	padding: 10px 15px;
	display: flex;
	align-items: center;
	font-size: 1rem;
	max-height: 48px;
	height: 48px;
	font-weight: 500;

	@media (max-width: 1199px) {
		height: 32px;
		max-height: 32px;
		padding: 5px 15px;
		border-radius: 12px;
	}
`;

const ChangeAccountContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: stretch;
`;

interface AccountDetailsProps {
	toggleWalletModal: () => void;
	pendingTransactions: string[];
	confirmedTransactions: string[];
	ENSName?: string | null;
	openOptions: () => void;
}

export default function AccountDetails({
	pendingTransactions,
	confirmedTransactions,
	ENSName,
	openOptions,
}: AccountDetailsProps) {
	const { chainId, account, connector } = useActiveWeb3React();

	function formatConnectorName() {
		const { ethereum } = window;
		const isMetaMask = !!(ethereum && ethereum.isMetaMask);
		const name = Object.keys(SUPPORTED_WALLETS)
			.filter(
				(k) =>
					SUPPORTED_WALLETS[k].connector === connector &&
					(connector !== injected || isMetaMask === (k === "METAMASK"))
			)
			.map((k) => SUPPORTED_WALLETS[k].name)[0];
		return <WalletName>Connected with {name}</WalletName>;
	}

	return (
		<>
			<UpperSection>
				<AccountSection>
					<YourAccount>
						<InfoCard>
							<AccountGroupingRow>{formatConnectorName()}</AccountGroupingRow>
							<AccountGroupingRow id="web3-account-identifier-row">
								<AccountControl>
									{ENSName ? (
										<>
											<div>
												<div className="symbol symbol-md mr-3">
													<ModifiedJazzicon address={account || ""} />
												</div>
												<WalletLink> {ENSName}</WalletLink>
											</div>
										</>
									) : (
										<>
											<div>
												<div className="symbol symbol-md mr-3">
													<ModifiedJazzicon address={account || ""} />
												</div>
												<WalletLink> {account && shortenAddress(account)}</WalletLink>
											</div>
										</>
									)}
								</AccountControl>
							</AccountGroupingRow>
							<AccountGroupingRow>
								{ENSName ? (
									<>
										<AccountControl>
											{account && (
												<Copy toCopy={account}>
													<WalletButtons style={{ marginLeft: "10px" }}>
														Copy Address
													</WalletButtons>
												</Copy>
											)}
											{chainId && account && (
												<AddressLink
													hasENS={!!ENSName}
													isENS={true}
													href={chainId && getEtherscanLink(chainId, ENSName, "address")}
												>
													<SVG
														src={
															require("../../assets/images/account/external-link.svg")
																.default
														}
													/>
													<WalletButtons style={{ marginLeft: "10px" }}>
														View on Etherscan
													</WalletButtons>
												</AddressLink>
											)}
										</AccountControl>
									</>
								) : (
									<>
										<AccountControl>
											{account && (
												<Copy toCopy={account}>
													<WalletButtons style={{ marginLeft: "10px" }}>
														Copy Address
													</WalletButtons>
												</Copy>
											)}
											{chainId && account && (
												<AddressLink
													hasENS={!!ENSName}
													isENS={false}
													href={getEtherscanLink(chainId, account, "address")}
												>
													<SVG
														src={
															require("../../assets/images/account/external-link.svg")
																.default
														}
													/>
													<WalletButtons style={{ marginLeft: "10px" }}>
														View on Etherscan
													</WalletButtons>
												</AddressLink>
											)}
										</AccountControl>
									</>
								)}
							</AccountGroupingRow>
						</InfoCard>
					</YourAccount>
				</AccountSection>

				<ChangeAccountContainer>
					<button
						className="btn btn-secondary-light d-block d-xl-none btn-block w-100 py-3"
						onClick={openOptions}
					>
						Change
					</button>
				</ChangeAccountContainer>
			</UpperSection>
		</>
	);
}