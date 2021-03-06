/* Greenbone Security Assistant
 *
 * Authors:
 * Björn Ricks <bjoern.ricks@greenbone.net>
 *
 * Copyright:
 * Copyright (C) 2017 Greenbone Networks GmbH
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import React from 'react';

import _ from 'gmp/locale.js';
import {is_defined} from 'gmp/utils.js';

import PropTypes from '../../utils/proptypes.js';

import EntitiesPage from '../../entities/page.js';
import withEntitiesContainer from '../../entities/withEntitiesContainer.js';

import HelpIcon from '../../components/icon/helpicon.js';
import NewIcon from '../../components/icon/newicon.js';

import IconDivider from '../../components/layout/icondivider.js';
import Layout from '../../components/layout/layout.js';

import {createFilterDialog} from '../../components/powerfilter/dialog.js';

import {
  ALL_CREDENTIAL_TYPES,
  USERNAME_PASSWORD_CREDENTIAL_TYPE,
} from 'gmp/models/credential.js';

import CredentialsDialog from './dialog.js';
import Table, {SORT_FIELDS} from './table.js';

const ToolBarIcons = ({
  onNewCredentialClick,
}, {capabilities}) => {
  return (
    <IconDivider>
      <HelpIcon
        page="credentials"
        title={_('Help: Credentials')}/>
      {capabilities.mayCreate('credential') &&
        <NewIcon
          title={_('New Credential')}
          onClick={onNewCredentialClick}/>
      }
    </IconDivider>
  );
};

ToolBarIcons.propTypes = {
  onNewCredentialClick: PropTypes.func,
};

ToolBarIcons.contextTypes = {
  capabilities: PropTypes.capabilities.isRequired,
};

class Page extends React.Component {

  constructor(...args) {
    super(...args);

    this.handleSaveCredential = this.handleSaveCredential.bind(this);
    this.openCredentialsDialog = this.openCredentialsDialog.bind(this);
  }

  openCredentialsDialog(credential) {
    if (credential) {
      this.credentials_dialog.show({
        allow_insecure: credential.allow_insecure,
        auth_algorithm: credential.auth_algorithm,
        base: credential.credential_type,
        comment: credential.comment,
        credential,
        credential_login: credential.login,
        id: credential.id,
        name: credential.name,
        privacy_algorithm: is_defined(credential.privacy) ?
          credential.privacy.algorithm : undefined,
        types: [credential.credential_type],
      }, {
        title: _('Edit Credential {{name}}', {name: credential.name}),
      });
    }
    else {
      this.credentials_dialog.show({
        types: ALL_CREDENTIAL_TYPES,
        base: USERNAME_PASSWORD_CREDENTIAL_TYPE,
      });
    }
  }

  handleSaveCredential(data) {
    const {onChanged, entityCommand} = this.props;
    let promise;
    if (data.credential) {
      promise = entityCommand.save(data);
    }
    else {
      promise = entityCommand.create(data);
    }
    return promise.then(() => onChanged());
  }

  render() {
    return (
      <Layout>
        <EntitiesPage
          onEditCredential={this.openCredentialsDialog}
          onNewCredentialClick={this.openCredentialsDialog}
          {...this.props}
        />
        <CredentialsDialog
          ref={ref => this.credentials_dialog = ref}
          onSave={this.handleSaveCredential}
        />
      </Layout>
    );
  }
}

Page.propTypes = {
  entityCommand: PropTypes.entitycommand,
  onChanged: PropTypes.func.isRequired,
};

export default withEntitiesContainer('credential', {
  filterEditDialog: createFilterDialog({
    sortFields: SORT_FIELDS,
  }),
  sectionIcon: 'credential.svg',
  table: Table,
  title: _('Credentials'),
  toolBarIcons: ToolBarIcons,
})(Page);

// vim: set ts=2 sw=2 tw=80:
