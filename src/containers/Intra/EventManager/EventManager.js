import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Route, Switch, Link } from 'react-router-dom'
import { Columns, Column, Title, Box, Button, Subtitle } from 'bloomer'
import isNil from 'lodash/isNil'
import { eventActions } from '../../../actions'
import { BaseContent } from '../../../components/Layout'
import DateTimePicker from '../../../components/DateTimePicker'
import EventList from './EventList'
import ModelEditor, { EditorField, EditorInput, EditorCheckbox } from '../../../components/Intra/ModelEditor'
import MarkdownEditor from '../../../components/ContentManagement/MarkdownEditor'
import { findEventById } from '../../../selectors/eventSelectors'
import EventFieldManager from './EventFieldManager'
import { INITIAL_ID } from '../../../constants'
import { isNewlyCreated, includesNewlyCreated, urlDisplayId } from '../../../store/helpers'
import { getArraySortedBy } from '../../../selectors/generalSelectors'
import ParticipantPage from '../../Enroll/ParticipantPage'

const rootPath = '/intra/events'

class EventManager extends PureComponent {
  componentDidMount() {
    this.props.fetchEvents()
  }

  componentDidUpdate = prevProps => {
    const { events } = this.props
    if(prevProps.events.length < events.length && includesNewlyCreated(events)) {
      this.handleActiveItemChange(INITIAL_ID)
    }
  }

  handleActiveItemChange = itemId => {
    this.props.openForEdit(urlDisplayId(itemId))
    this.props.clearErrors()
  }

  clearSelection = () => {
    this.props.closeEditor()
    this.props.clearErrors()
  }

  renderEditor = (item, validationErrors) =>
    <ModelEditor
      item={item}
      onSave={isNewlyCreated(item) ? this.props.addEvent : this.props.updateEvent}
      onCancel={this.clearSelection}
      onRemove={this.removeItem}
      renderFields={(item, handleInputChange, updateStateItem) => (
        <Columns isMultiline>
          <Column isSize={{ desktop: '1/2', tablet: 'full' }}>
            {!isNewlyCreated(item) &&
              <Link to={`${rootPath}/${item.id}/enrolls`} >Osallistujat</Link>
            }
            <Subtitle isSize={5}>Perustiedot
              {!isNewlyCreated(item) && <small className='has-text-grey-light'> (ID: {item.id})</small>}
            </Subtitle>
            <Columns className='ml-3'>
              <Column isSize='full'>
                <EditorField label='Nimi *' >
                  <EditorInput
                    field='name'
                    model={item}
                    onChange={handleInputChange}
                    validationErrors={validationErrors} />
                </EditorField>
              </Column>
            </Columns>
            <Columns className='ml-3'>
              <Column isSize='narrow'>
                <EditorField label='Ilmoittautuminen alkaa *' >
                  <DateTimePicker
                    selectedDate={item.activeAt}
                    onChange={date => updateStateItem({ activeAt: date })}
                  />
                </EditorField>
              </Column>
              <Column>
                <EditorField label='Ilmoittautuminen päättyy *' >
                  <DateTimePicker
                    selectedDate={item.activeUntil}
                    onChange={date => updateStateItem({ activeUntil: date })}
                  />
                </EditorField>
              </Column>
            </Columns>
            <Columns className='ml-3'>
              <Column>
                <EditorField label='Näytetään listalla' >
                  <EditorCheckbox
                    field='isVisible'
                    model={item}
                    onChange={handleInputChange}
                    validationErrors={validationErrors} />
                </EditorField>
              </Column>
              <Column>
                <EditorField label='Julkinen' >
                  <EditorCheckbox
                    field='isPublished'
                    model={item}
                    onChange={handleInputChange}
                    validationErrors={validationErrors} />
                </EditorField>
              </Column>
            </Columns>
          </Column>
          <Column isSize={{ desktop: '1/2', tablet: 'full' }}>
            <Subtitle isSize={5}>Rajat</Subtitle>
            <Columns className='ml-3'>
              <Column>
                <EditorField label='Osallistujamäärä *' >
                  <EditorInput
                    field='maxParticipants'
                    model={item}
                    onChange={handleInputChange}
                    validationErrors={validationErrors} />
                </EditorField>
              </Column>
              <Column>
                <EditorField label='Varasijoja' >
                  <EditorInput
                    field='reserveCount'
                    model={item}
                    onChange={handleInputChange}
                    validationErrors={validationErrors} />
                </EditorField>
              </Column>
              <Column>
                <EditorField label='Kiintiöiden aukeamisaika' >
                  <DateTimePicker
                    selectedDate={item.reservedUntil}
                    onChange={date => updateStateItem({ reservedUntil: date })}
                    className='input is-small'
                  />
                </EditorField>
              </Column>
            </Columns>
          </Column>
          <Column isSize='full'>
            <Subtitle isSize={5}>Tapahtumakuvaus</Subtitle>
            <Columns className='ml-3'>
              <Column>
                <MarkdownEditor
                  content={item.description}
                  handleTextChange={description => updateStateItem({ description: description || '' })}
                />
              </Column>
            </Columns>
            <EditorField label='Kentät' >
              <EventFieldManager
                fields={item.fields}
                updateFields={updateStateItem}
                validationErrors={validationErrors} />
            </EditorField>
          </Column>
          <span className='has-text-grey-light ml-3'>* pakollinen</span>
        </Columns>
      )}
    />

  removeItem = item => {
    this.props.removeEvent(item)
    this.clearSelection()
  }

  render = () => {
    const { events, initNewEvent, validationErrors } = this.props
    return (
      <BaseContent>
        <Column>
          <Title>Tapahtumat</Title>
          <Columns isMultiline>
            <Column isSize='narrow'>
              <EventList
                onItemClick={this.handleActiveItemChange}
                events={events} />
            </Column>
            <Column>
              <Button
                isSize='small'
                isColor='primary'
                onClick={initNewEvent}>
                Lisää uusi
              </Button>
              <Box>
                <Switch>
                  <Route
                    path={`${rootPath}/:activeItemId`}
                    exact
                    render={({ match }) => {
                      const { activeItemId } = match.params
                      const activeItem = !isNil(activeItemId) && findEventById(events, activeItemId)
                      return activeItem
                        ? this.renderEditor(activeItem, validationErrors)
                        : `Tapahtumaa ei löytynyt`
                    }}
                  />
                  <Route
                    path={`${rootPath}/:activeItemId/enrolls`}
                    render={({ match }) => {
                      const { activeItemId } = match.params
                      const activeItem = !isNil(activeItemId) && findEventById(events, activeItemId)
                      return activeItem
                        ? <ParticipantPage eventId={activeItem.id} />
                        : `Tapahtumaa ei löytynyt`
                    }}
                  />
                  <Route render={() => <p>Valitse muokattava kohde listalta</p>} />
                </Switch>
              </Box>
            </Column >
          </Columns >
        </Column >
      </BaseContent >
    )
  }
}

EventManager.propTypes = {
  openForEdit: PropTypes.func.isRequired,
  closeEditor: PropTypes.func.isRequired,
  events: PropTypes.array.isRequired,
  validationErrors: PropTypes.shape({ msg: PropTypes.string }),
  fetchEvents: PropTypes.func.isRequired,
  initNewEvent: PropTypes.func.isRequired,
  clearErrors: PropTypes.func.isRequired,
  addEvent: PropTypes.func.isRequired,
  updateEvent: PropTypes.func.isRequired,
  removeEvent: PropTypes.func.isRequired
}

const mapStateToProps = (state, ownProps) => ({
  events: getArraySortedBy(state,
    {
      path: 'events',
      sortByKey: 'activeAt',
      orderBy: 'asc'
    }),
  validationErrors: state.events.error,
  closeEditor: () => ownProps.history.push(rootPath),
  openForEdit: activeItemId => ownProps.history.push(`${rootPath}/${activeItemId}`)
})

const mapDispatchToProps = (dispatch) => ({
  clearErrors: () => dispatch(eventActions.clearErrors()),
  fetchEvents: () => dispatch(eventActions.fetchEvents(true)),
  fetchEvent: eventId => dispatch(eventActions.fetchEvent(eventId)),
  initNewEvent: () => dispatch(eventActions.prepareNew()),
  addEvent: item => dispatch(eventActions.addEvent(item)),
  updateEvent: item => dispatch(eventActions.updateEvent(item)),
  removeEvent: item => dispatch(eventActions.removeEvent(item))
})

export default connect(mapStateToProps, mapDispatchToProps)(EventManager)
