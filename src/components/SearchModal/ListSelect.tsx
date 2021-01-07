import React, {memo, useCallback, useContext, useMemo, useRef, useState} from 'react'
import { ArrowLeft } from 'react-feather'
import ReactGA from 'react-ga'
import { useDispatch, useSelector } from 'react-redux'
import { Text } from 'rebass'
import {Button, Form, Dropdown} from "react-bootstrap";
import styled, {ThemeContext} from 'styled-components'
import { useFetchListCallback } from '../../hooks/useFetchListCallback'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'

import useToggle from '../../hooks/useToggle'
import { AppDispatch, AppState } from '../../state'
import { acceptListUpdate, removeList, selectList } from '../../state/lists/actions'
import { useSelectedListUrl } from '../../state/lists/hooks'
import { CloseIcon, TYPE } from '../../theme'
import listVersionLabel from '../../utils/listVersionLabel'
import { parseENSAddress } from '../../utils/parseENSAddress'
import uriToHttp from '../../utils/uriToHttp'

import Column from '../Column'
import ListLogo from '../ListLogo'
import QuestionHelper from '../QuestionHelper'
import Row, { RowBetween } from '../Row'
import { PaddedColumn, Separator } from './styleds'


const StyledListUrlText = styled.div`
  max-width: 160px;
  opacity: 0.6;
  margin-right: 0.5rem;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
`

function ListOrigin({ listUrl }: { listUrl: string }) {
  const ensName = useMemo(() => parseENSAddress(listUrl)?.ensName, [listUrl])
  const host = useMemo(() => {
    if (ensName) return undefined
    const lowerListUrl = listUrl.toLowerCase()
    if (lowerListUrl.startsWith('ipfs://') || lowerListUrl.startsWith('ipns://')) {
      return listUrl
    }
    try {
      const url = new URL(listUrl)
      return url.host
    } catch (error) {
      return undefined
    }
  }, [listUrl, ensName])
  return <>{ensName ?? host}</>
}

function listUrlRowHTMLId(listUrl: string) {
  return `list-row-${listUrl.replace(/\./g, '-')}`
}

const ListRow = memo(function ListRow({ listUrl, onBack }: { listUrl: string; onBack: () => void }) {
  const listsByUrl = useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)
  const selectedListUrl = useSelectedListUrl()
  const dispatch = useDispatch<AppDispatch>()
  const { current: list, pendingUpdate: pending } = listsByUrl[listUrl]

  const isSelected = listUrl === selectedListUrl

  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()


  useOnClickOutside(node, open ? toggle : undefined)

  const selectThisList = useCallback(() => {
    if (isSelected) return
    ReactGA.event({
      category: 'Lists',
      action: 'Select List',
      label: listUrl
    })

    dispatch(selectList(listUrl))
    onBack()
  }, [dispatch, isSelected, listUrl, onBack])

  const handleAcceptListUpdate = useCallback(() => {
    if (!pending) return
    ReactGA.event({
      category: 'Lists',
      action: 'Update List from List Select',
      label: listUrl
    })
    dispatch(acceptListUpdate(listUrl))
  }, [dispatch, listUrl, pending])

  const handleRemoveList = useCallback(() => {
    ReactGA.event({
      category: 'Lists',
      action: 'Start Remove List',
      label: listUrl
    })
    if (window.prompt(`Please confirm you would like to remove this list by typing REMOVE`) === `REMOVE`) {
      ReactGA.event({
        category: 'Lists',
        action: 'Confirm Remove List',
        label: listUrl
      })
      dispatch(removeList(listUrl))
    }
  }, [dispatch, listUrl])

  if (!list) return null

  // @ts-ignore
  // @ts-ignore
  return (
    <Row key={listUrl} align="center" padding="16px" id={listUrlRowHTMLId(listUrl)}>
      {list.logoURI ? (
        <ListLogo style={{ marginRight: '1rem' }} logoURI={list.logoURI} alt={`${list.name} list logo`} />
      ) : (
        <div style={{ width: '24px', height: '24px', marginRight: '1rem' }} />
      )}
      <Column style={{ flex: '1' }}>
        <Row>
          <Text
            fontWeight={isSelected ? 500 : 400}
            fontSize={16}
            style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {list.name}
          </Text>
        </Row>
        <Row
          style={{
            marginTop: '4px'
          }}
        >
          <StyledListUrlText title={listUrl}>
            <ListOrigin listUrl={listUrl} />
          </StyledListUrlText>
        </Row>
      </Column>
      <Dropdown>

        <Dropdown.Toggle split variant="outline-primary" id="dropdown-split-basic" className={'mr-3'} />

        <Dropdown.Menu>
          <Dropdown.Item className={'text-muted'} disabled={true}>{list && listVersionLabel(list.version)}</Dropdown.Item>
          <Dropdown.Divider/>
          <Dropdown.Item href={`https://tokenlists.org/token-list?url=${listUrl}`}>View list</Dropdown.Item>
          <Dropdown.Item  onClick={handleRemoveList} disabled={Object.keys(listsByUrl).length === 1}>Remove list</Dropdown.Item>
          {pending && (
              <Dropdown.Item onClick={handleAcceptListUpdate}>Update list</Dropdown.Item>
          )}
        </Dropdown.Menu>

      </Dropdown>

      {isSelected ? (
          <Button
              variant={'primary'}
              disabled={true}
              className={'px-5'}
          >
            Selected
          </Button>
      ) : (
          <Button
              variant={'primary'}
              className={'px-5'}
              onClick={selectThisList}
              style={{ width: 90}}
          >
            Select
          </Button>
      )}
    </Row>
  )
})

const ListContainer = styled.div`
  flex: 1;
  overflow: auto;
`

export function ListSelect({ onDismiss, onBack }: { onDismiss: () => void; onBack: () => void }) {
  const [listUrlInput, setListUrlInput] = useState<string>('')

  const theme = useContext(ThemeContext);

  const dispatch = useDispatch<AppDispatch>()
  const lists = useSelector<AppState, AppState['lists']['byUrl']>(state => state.lists.byUrl)
  const adding = Boolean(lists[listUrlInput]?.loadingRequestId)
  const [addError, setAddError] = useState<string | null>(null)

  const handleInput = useCallback(e => {
    setListUrlInput(e.target.value)
    setAddError(null)
  }, [])
  const fetchList = useFetchListCallback()

  const handleAddList = useCallback(() => {
    if (adding) return
    setAddError(null)
    fetchList(listUrlInput)
      .then(() => {
        setListUrlInput('')
        ReactGA.event({
          category: 'Lists',
          action: 'Add List',
          label: listUrlInput
        })
      })
      .catch(error => {
        ReactGA.event({
          category: 'Lists',
          action: 'Add List Failed',
          label: listUrlInput
        })
        setAddError(error.message)
        dispatch(removeList(listUrlInput))
      })
  }, [adding, dispatch, fetchList, listUrlInput])

  const validUrl: boolean = useMemo(() => {
    return uriToHttp(listUrlInput).length > 0 || Boolean(parseENSAddress(listUrlInput))
  }, [listUrlInput])

  const handleEnterKey = useCallback(
    e => {
      if (validUrl && e.key === 'Enter') {
        handleAddList()
      }
    },
    [handleAddList, validUrl]
  )

  const sortedLists = useMemo(() => {
    const listUrls = Object.keys(lists)
    return listUrls
      .filter(listUrl => {
        return Boolean(lists[listUrl].current)
      })
      .sort((u1, u2) => {
        const { current: l1 } = lists[u1]
        const { current: l2 } = lists[u2]
        if (l1 && l2) {
          return l1.name.toLowerCase() < l2.name.toLowerCase()
            ? -1
            : l1.name.toLowerCase() === l2.name.toLowerCase()
            ? 0
            : 1
        }
        if (l1) return -1
        if (l2) return 1
        return 0
      })
  }, [lists])

  return (
    <Column style={{ width: '100%', flex: '1 1' }}>
      <PaddedColumn>
        <RowBetween>
          <div>
            <ArrowLeft style={{ cursor: 'pointer' }} onClick={onBack} />
          </div>

          <Text fontWeight={600} fontSize={'16px'}>
            Manage Lists
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
      </PaddedColumn>

      <Separator />

      <PaddedColumn gap="14px">
        <Text fontWeight={600}>
          Add a list{' '}
          <QuestionHelper text="Token lists are an open specification for lists of ERC20 tokens. You can use any token list by entering its URL below. Beware that third party token lists can contain fake or malicious ERC20 tokens." />
        </Text>
        <Row>
          <Form.Control
              size={'lg'}
              style={{
                backgroundColor: theme.bg2,
                color: theme.text1
              }}
            type="text"
            id="list-add-input"
            placeholder="https:// or ipfs:// or ENS name"
            value={listUrlInput}
            onChange={handleInput}
            onKeyDown={handleEnterKey}
          />
          <Button variant={'outline-primary'} size={'lg'} onClick={handleAddList} disabled={!validUrl} className={'ml-3'}>
            Add
          </Button>
        </Row>
        {addError ? (
          <TYPE.error title={addError} style={{ textOverflow: 'ellipsis', overflow: 'hidden' }} error>
            {addError}
          </TYPE.error>
        ) : null}
      </PaddedColumn>

      <Separator />

      <ListContainer>
        {sortedLists.map(listUrl => (
          <ListRow key={listUrl} listUrl={listUrl} onBack={onBack} />
        ))}
      </ListContainer>
      <Separator />

      <div style={{ padding: '16px', textAlign: 'center' }}>
        <a href={"https://tokenlists.org"} className={'btn btn-block'}
           style={{
             backgroundColor: theme.bg3,
             color: theme.text2,
             border: 'none'
           }}>
          Browse lists
        </a>
      </div>
    </Column>
  )
}