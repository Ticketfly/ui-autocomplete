import Ember from 'ember';
import layout from '../templates/components/ui-autocomplete';
import OptionListAriaMixin from 'ui-option-list/mixins/option-list-aria';
import { EKMixin, EKOnFocusMixin, EKFirstResponderOnFocusMixin, keyDown } from 'ember-keyboard';

const { computed, on, run, RSVP, get } = Ember;
const { Promise, defer } = RSVP;

const ProxyContent = Ember.Object.extend(Ember.PromiseProxyMixin);

export default Ember.Component.extend(EKMixin, EKOnFocusMixin, EKFirstResponderOnFocusMixin, OptionListAriaMixin, {
  layout: layout,
  classNames: ['ff-autocomplete'],
  classNameBindings: ['isOpen'],
  fieldComponent: 'ui-autocomplete-field',
  loaderComponent: null,

  debouncePeriod: 0,

  // Array necessary for ui-option-list, should fix there.
  selectedValues: Ember.A(),

  /*
    This computed property wraps a passed promise
    and allows to watch this promise's state.

    @return {PromiseProxyObject} Promise Proxy
  */
  proxyContent: computed('items.[]', {
    get() {
      const items = this.get('items') || [];

      if (isPromiseOrDeferred(items)) {
        return ProxyContent.create({
          promise: get(items, 'promise') || items
        });
      } else {
        return {
          content: items
        };
      }
    },

    set(key, value) {
      return ProxyContent.create({
        promise: value.promise
      });
    }
  }),

  /*
    Checks if the promise is pending. Also takes input value
    into account (if the value is an empty string, promise is
    considered fulfilled).

    @return {Boolean} Whether promise is pending or not
  */
  isPromisePending: computed('proxyContent.isPending', 'query', {
    get() {
      const query = this.get('query');
      const isPending = this.get('proxyContent.isPending');

      return isPending && !!query;
    }
  }).readOnly(),

  cleanupEventListeners: on('willDestroyElement', function() {
    Ember.$(document).off('mousedown.ui-autocomplete');
  }),

  sendQueryChange() {
    const query = this.get('query');

    this.sendAction('on-change', query);
  },

  canSendQuery(query) {
    const inactiveQueryValues = this.get('inactiveQueryValues');

    if (inactiveQueryValues) {
      return !!query && !inactiveQueryValues.split(' ').contains(query);
    }

    return !!query;
  },

  contains(target) {
    return !!this.$().find(target).length;
  },

  closeAutocomplete: on(keyDown('Escape'), function() {
    this.set('value', '');
    this.send('close');
  }),

  actions: {
    open() {
      this.set('isOpen', true);

      Ember.$(document).on('mousedown.ui-autocomplete', ({ target }) => {
        if (!this.contains(target)) {
          this.send('close');
        }
      });
    },

    close() {
      Ember.$(document).off('mousedown.ui-autocomplete');

      this.set('isOpen', false);
    },

    selectItem(value) {
      this.sendAction('on-select', value);
      this.send('close');
    },

    refocusInput(event) {
      this.get('field').focus();

      if (event) {
        event.stopPropagation();
      }
    },

    handleFieldKeyPress(query) {
      if (this.canSendQuery(query)) {
        if (query !== this.get('query')) {
          this.set('proxyContent', defer());
        }

        this.set('query', query);
        this.send('open');
        run.debounce(this, 'sendQueryChange', this.get('debouncePeriod'));
      } else {
        this.send('close');
      }
    }
  }
});

/*
  Checks whether an object is Ember.RSVP.Promise or Ember.RSVP.Defer.

  @params {Promise|Defer}
  @private
  return {Boolean}
*/
function isPromiseOrDeferred(promise) {
  return !promise ? false : promise instanceof Promise || get(promise, 'promise') instanceof Promise;
}
