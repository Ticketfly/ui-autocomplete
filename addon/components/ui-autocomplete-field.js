import Ember from 'ember';
import UiAutocomplete from './ui-autocomplete';
import { EKMixin, EKOnFocusMixin, EKFirstResponderOnFocusMixin, keyDown } from 'ember-keyboard';

const { on } = Ember;

export default Ember.TextField.extend(EKMixin, EKOnFocusMixin, EKFirstResponderOnFocusMixin, {
  attributeBindings: [
    'role',
    'aria-activedescendant',
    'aria-expanded',
    'aria-autocomplete',
    'aria-owns',
    'aria-haspopup',
    'aria-disabled',
    'aria-labelledby'
  ],

  registerWithAutocomplete: on('didInsertElement', function() {
    this.nearestOfType(UiAutocomplete).set('field', this.$());
  }),

  selectFirstOption: on(keyDown('ArrowDown'), function() {
    this.$().parent().find('.ff-option:first').focus();
  }),

  selectLastOption: on(keyDown('ArrowUp'), function() {
    this.$().parent().find('.ff-option:last').focus();
  })
});
