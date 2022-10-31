import { splitProps, JSX, Show } from 'solid-js';

export type PageLinkProps = JSX.HTMLAttributes<HTMLAnchorElement> & {
    active?: boolean;
    disabled?: boolean;
};

export default function PageLink(props: PageLinkProps) {

  const [status, otherProps] = splitProps(props, ["active", "disabled"]);

  return (
    <Show when={!status.disabled} fallback={<span class='page-link disabled'>{props.children}</span>}>
      <a
        class='page-link'
        classList={{active : status.active}}
        aria-current={status.active ? 'page' : undefined}
        {...otherProps}
      >
        {props.children}
      </a>
    </Show>
  );
}